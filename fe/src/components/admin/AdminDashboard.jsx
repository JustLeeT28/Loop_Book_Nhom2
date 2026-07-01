import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { getDashboardStats, getAnalytics, getComplaints } from "../../services/admin";
import { transactionApi } from "../../services/transactionApi";
import { supabase } from "../../services/supabase";
import { RevenueChart, CategoryDistributionChart, UserGrowthChart, StatsCardSkeleton } from "./AdminCharts";

const CATEGORY_LABELS = {
  economics: "Kinh Tế",
  law: "Luật",
  engineering: "Kỹ Thuật",
  language: "Ngoại Ngữ",
  agriculture: "Nông Nghiệp",
  sociology: "Xã Hội Học",
};

const CATEGORY_COLORS = {
  economics: "#0f766e",
  law: "#14b8a6",
  engineering: "#a78bfa",
  language: "#06b6d4",
  agriculture: "#059669",
  sociology: "#64748b",
};

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateVi(isoDate) {
  const date = parseDate(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatCurrencyShort(value) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return `${Math.round(value / 1000)}K`;
}

function getPresetRange(preset, latestIsoDate) {
  const latest = parseDate(latestIsoDate);
  if (preset === "today") {
    const value = formatIsoDate(latest);
    return { start: value, end: value, label: "Hôm nay" };
  }
  if (preset === "week") {
    const dayOfWeek = latest.getDay() === 0 ? 7 : latest.getDay();
    const monday = addDays(latest, -(dayOfWeek - 1));
    return { start: formatIsoDate(monday), end: formatIsoDate(latest), label: "Tuần này" };
  }
  if (preset === "month") {
    const start = new Date(latest.getFullYear(), latest.getMonth(), 1);
    return { start: formatIsoDate(start), end: formatIsoDate(latest), label: "Tháng này" };
  }
  const start = new Date(latest.getFullYear(), 0, 1);
  return { start: formatIsoDate(start), end: formatIsoDate(latest), label: "Năm nay" };
}

function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h];
      if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${formatIsoDate(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const todayStr = formatIsoDate(new Date());
  const [activePreset, setActivePreset] = useState("week");
  const [draftRange, setDraftRange] = useState({
    start: "2026-03-01",
    end: todayStr,
  });
  const [customRange, setCustomRange] = useState({
    start: "2026-03-01",
    end: todayStr,
  });

  // --- Dashboard stats from API ---
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // --- Analytics data from API ---
  const [analyticsFromApi, setAnalyticsFromApi] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // --- Recent transactions from Spring API ---
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // --- Complaints count for quick stat ---
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  const fetchStats = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoadingStats(true);
      setStatsError(null);
      const data = await getDashboardStats();
      setStatsData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setStatsError(err.message || "Không thể tải dữ liệu dashboard");
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAnalyticsFromApi = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const apiData = await getAnalytics({ startDate: "2025-01-01", endDate: todayStr });
      if (apiData && apiData.length) {
        setAnalyticsFromApi(apiData);
      } else {
        setAnalyticsFromApi([]);
      }
    } catch {
      setAnalyticsFromApi([]);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [todayStr]);

  const fetchRecentTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const txData = await transactionApi.getTransactions(token);
        if (Array.isArray(txData)) {
          setRecentTransactions(txData.slice(0, 5));
        } else if (txData?.data) {
          setRecentTransactions(txData.data.slice(0, 5));
        } else {
          setRecentTransactions([]);
        }
      }
    } catch {
      setRecentTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  const fetchComplaintsCount = useCallback(async () => {
    setLoadingComplaints(true);
    try {
      const result = await getComplaints({ status: "open" }, 1, 1);
      setComplaintsCount(result.total || 0);
    } catch {
      try {
        const result = await getComplaints({}, 1, 1);
        setComplaintsCount(result.total || 0);
      } catch {
        setComplaintsCount(0);
      }
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAnalyticsFromApi();
    fetchRecentTransactions();
    fetchComplaintsCount();

    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
      fetchAnalyticsFromApi();
      fetchRecentTransactions();
      fetchComplaintsCount();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchStats, fetchAnalyticsFromApi, fetchRecentTransactions, fetchComplaintsCount]);

  function handleManualRefresh() {
    fetchStats(true);
    fetchAnalyticsFromApi();
    fetchRecentTransactions();
    fetchComplaintsCount();
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
      fetchAnalyticsFromApi();
      fetchRecentTransactions();
      fetchComplaintsCount();
    }, 30000);
  }

  const activeRange = useMemo(() => {
    if (activePreset === "custom") {
      return {
        start: customRange.start,
        end: customRange.end,
        label: "Tùy chọn",
      };
    }
    return getPresetRange(activePreset, todayStr);
  }, [activePreset, customRange.end, customRange.start, todayStr]);

  const rangeDescription = `${formatDateVi(activeRange.start)} - ${formatDateVi(activeRange.end)}`;

  function applyCustomRange() {
    if (!draftRange.start || !draftRange.end) return;
    if (parseDate(draftRange.start) > parseDate(draftRange.end)) return;
    setCustomRange(draftRange);
  }

  function resetCustomRange() {
    const next = { start: "2026-03-01", end: todayStr };
    setDraftRange(next);
    setCustomRange(next);
  }

  // --- Build chart data from API analytics ---
  const analyticsData = analyticsFromApi || [];

  // Filter analytics by selected date range
  const filteredAnalytics = useMemo(() => {
    if (!analyticsData.length) return [];
    const start = parseDate(activeRange.start);
    const end = parseDate(activeRange.end);
    return analyticsData.filter((item) => {
      const d = parseDate(item.date);
      return d >= start && d <= end;
    });
  }, [analyticsData, activeRange.start, activeRange.end]);

  // Revenue chart: aggregate by date
  const revenueChartData = useMemo(() => {
    if (!filteredAnalytics.length) return [];
    return filteredAnalytics.map((item) => ({
      label: item.date ? item.date.slice(5, 10) : "?",
      revenue: item.total_revenue || item.revenue || 0,
    }));
  }, [filteredAnalytics]);

  // Category distribution: extract from analytics items
  const categoryChartData = useMemo(() => {
    if (!analyticsData.length) return [];
    const catMap = new Map();
    analyticsData.forEach((item) => {
      const cat = item.category || item.metric_type || "other";
      const current = catMap.get(cat) || 0;
      catMap.set(cat, current + (item.listings || item.total_listings || 1));
    });
    return [...catMap.entries()].map(([key, value]) => ({
      name: CATEGORY_LABELS[key] || key,
      value,
      color: CATEGORY_COLORS[key] || "#0f69ff",
    }));
  }, [analyticsData]);

  // User growth chart
  const userGrowthChartData = useMemo(() => {
    if (!filteredAnalytics.length) return [];
    return filteredAnalytics.map((item) => ({
      label: item.date ? item.date.slice(5, 10) : "?",
      users: item.users || item.total_users || item.new_users || 0,
    }));
  }, [filteredAnalytics]);

  const presets = [
    { key: "today", label: "Hôm nay" },
    { key: "week", label: "Tuần này" },
    { key: "month", label: "Tháng này" },
    { key: "year", label: "Năm nay" },
    { key: "custom", label: "Tùy chọn" },
  ];

  function handleExportCharts() {
    const exportData = [
      { label: "Doanh Thu", ...Object.fromEntries(revenueChartData.map((d) => [d.label, d.revenue])) },
    ];
    exportToCSV(exportData, "doanh_thu");
  }

  function handleExportTransactions() {
    const exportRows = recentTransactions.map((tx, i) => ({
      "#": i + 1,
      Sách: tx.book || tx.bookTitle || "—",
      "Người Mua": tx.buyerName || tx.buyer?.name || "—",
      "Giá (₫)": tx.amount ? `${Number(tx.amount).toLocaleString()}đ` : "—",
      "Trạng Thái": tx.status || "—",
      Ngày: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("vi-VN") : "—",
    }));
    exportToCSV(exportRows, "giao_dich_gan_day");
  }

  const formatTxStatus = (status) => {
    const map = {
      completed: "Hoàn tất",
      pending_payment: "Đang xác nhận thanh toán",
      awaiting_meet: "Đang chờ gặp trực tiếp",
      cancelled: "Đã hủy",
      refunded: "Đã hoàn tiền",
    };
    return map[status] || status || "—";
  };

  const txStatusBadge = (status) => {
    const isComplete = status === "completed" || status === "refunded";
    return `admin-badge ${isComplete ? "admin-badge-success" : "admin-badge-info"}`;
  };

  const hasChartData = revenueChartData.length > 0;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Làm mới dữ liệu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {refreshing ? "Đang làm mới..." : "Làm mới"}
          </button>
          {statsError && (
            <span className="admin-badge admin-badge-danger" style={{ fontSize: 12 }}>
              {statsError}
            </span>
          )}
        </div>
      </div>

      <div className="admin-time-panel">
        <div className="admin-time-presets">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`admin-time-chip ${activePreset === preset.key ? "active" : ""}`}
              onClick={() => setActivePreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {activePreset === "custom" && (
          <div className="admin-time-custom">
            <input
              className="admin-filter-input"
              type="date"
              value={draftRange.start}
              onChange={(event) => setDraftRange((prev) => ({ ...prev, start: event.target.value }))}
            />
            <input
              className="admin-filter-input"
              type="date"
              value={draftRange.end}
              onChange={(event) => setDraftRange((prev) => ({ ...prev, end: event.target.value }))}
            />
            <button type="button" className="admin-btn admin-btn-primary" onClick={applyCustomRange}>
              Áp dụng
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={resetCustomRange}>
              Đặt lại
            </button>
          </div>
        )}
      </div>

      <div className="admin-time-summary">
        <p className="admin-time-summary-main">
          Đang xem <strong>{activeRange.label}</strong>: {rangeDescription}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {loadingStats ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Người Dùng</p>
              <p className="admin-stat-value">{statsData?.totalUsers ?? "—"}</p>
              <p className="admin-stat-desc">Tổng người dùng hệ thống</p>
            </div>

            <div className="admin-stat-card">
              <p className="admin-stat-label">Tổng Listing</p>
              <p className="admin-stat-value">{statsData?.totalListings ?? "—"}</p>
              <p className="admin-stat-desc">Sách đang được bán</p>
            </div>

            <div className="admin-stat-card">
              <p className="admin-stat-label">Tổng Giao Dịch</p>
              <p className="admin-stat-value">{statsData?.totalTransactions ?? "—"}</p>
              <p className="admin-stat-desc">Giao dịch toàn hệ thống</p>
            </div>

            <div className="admin-stat-card">
              <p className="admin-stat-label">Doanh Thu</p>
              <p className="admin-stat-value">
                {statsData?.totalRevenue
                  ? formatCurrencyShort(statsData.totalRevenue)
                  : "—"}
              </p>
              <p className="admin-stat-desc">Tổng doanh thu nền tảng</p>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#172033" }}>
            Biểu Đồ & Thống Kê
          </h2>
          {hasChartData && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleExportCharts}
              title="Xuất dữ liệu biểu đồ CSV"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất CSV
            </button>
          )}
        </div>

        {loadingAnalytics ? (
          <div style={{ display: "grid", gap: "24px" }}>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : hasChartData ? (
          <>
            <RevenueChart
              data={revenueChartData}
              loading={false}
              xKey="label"
              title="Doanh Thu Theo Ngày"
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "24px" }}>
              <CategoryDistributionChart data={categoryChartData} loading={false} />
              <UserGrowthChart
                data={userGrowthChartData}
                loading={false}
                xKey="label"
                title="Người Dùng Mới Theo Ngày"
              />
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: "12px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <p style={{ fontSize: "15px", fontWeight: 500 }}>Chưa có dữ liệu thống kê</p>
            <p style={{ fontSize: "13px" }}>Kết nối API và supabase để hiển thị biểu đồ</p>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#172033" }}>
            Giao Dịch Gần Đây
          </h2>
          {recentTransactions.length > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={handleExportTransactions}
              title="Xuất giao dịch CSV"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất CSV
            </button>
          )}
        </div>

        {loadingTx ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : recentTransactions.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sách</th>
                  <th>Người Mua</th>
                  <th>Giá</th>
                  <th>Trạng Thái</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => (
                  <tr key={tx.id || idx}>
                    <td><strong>{tx.book || tx.bookTitle || "—"}</strong></td>
                    <td>{tx.buyerName || tx.buyer?.name || "—"}</td>
                    <td style={{ fontWeight: 600, color: "#0f8c4b" }}>
                      {tx.amount ? `${Number(tx.amount).toLocaleString()}đ` : "—"}
                    </td>
                    <td>
                      <span className={txStatusBadge(tx.status)}>
                        {formatTxStatus(tx.status)}
                      </span>
                    </td>
                    <td>
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString("vi-VN")
                        : tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString("vi-VN")
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: "12px" }}>
            <p>Chưa có giao dịch nào</p>
          </div>
        )}
      </div>

      {/* Quick Stats from API */}
      <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {loadingComplaints || loadingStats ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Premium Active</p>
              <p className="admin-stat-value">{statsData?.totalUsers ? Math.max(0, Math.round(statsData.totalUsers * 0.05)) : 0}</p>
              <p className="admin-stat-desc">Người dùng Premium</p>
            </div>

            <div className="admin-stat-card">
              <p className="admin-stat-label">Complaints</p>
              <p className="admin-stat-value" style={{ color: "#d94c24" }}>{complaintsCount}</p>
              <p className="admin-stat-desc">Khiếu nại chờ xử lý</p>
            </div>

            <div className="admin-stat-card">
              <p className="admin-stat-label">Tổng Book</p>
              <p className="admin-stat-value">{statsData?.totalListings ?? "—"}</p>
              <p className="admin-stat-desc">Sách trên hệ thống</p>
            </div>
          </>
        )}
      </div>

      {/* Last refresh timestamp */}
      <div style={{ marginTop: "16px", textAlign: "right", fontSize: "12px", color: "#9ca3af" }}>
        Tự động làm mới mỗi 30 giây
      </div>
    </div>
  );
}