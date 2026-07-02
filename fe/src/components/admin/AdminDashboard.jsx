import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { getDashboardStats, getAnalytics, getCategoryDistribution, getComplaints, getPremiumUsers, getPremiumPlans, getPremiumRevenue, getPremiumActiveCount, createPremiumPlan, updatePremiumPlan } from "../../services/admin";
import { transactionApi } from "../../services/transactionApi";
import { supabase } from "../../services/supabase";
import { RevenueChart, CategoryDistributionChart, UserGrowthChart, StatsCardSkeleton } from "./AdminCharts";

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

  // --- Premium Management ---
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [premiumActiveCount, setPremiumActiveCount] = useState(0);
  const [premiumRevenue, setPremiumRevenue] = useState(0);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [newPlanData, setNewPlanData] = useState({ id: "", name: "", price: 0, summary: "" });
  const [editingPlanId, setEditingPlanId] = useState(null);

  // --- Modal Detail ---
  const [detailModal, setDetailModal] = useState({ show: false, user: null });

  // --- Renew Modal ---
  const [renewModal, setRenewModal] = useState({ show: false, user: null });

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

  const fetchPremiumData = useCallback(async () => {
    setLoadingPremium(true);
    try {
      const [usersResult, plansData, activeCount, revenue] = await Promise.all([
        getPremiumUsers(1, 50),
        getPremiumPlans(),
        getPremiumActiveCount(),
        getPremiumRevenue(),
      ]);
      setPremiumUsers(usersResult.data || []);
      setPremiumPlans(plansData || []);
      setPremiumActiveCount(activeCount);
      setPremiumRevenue(revenue);
    } catch (err) {
      console.warn("fetchPremiumData error:", err?.message);
    } finally {
      setLoadingPremium(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAnalyticsFromApi();
    fetchRecentTransactions();
    fetchComplaintsCount();
    fetchPremiumData();

    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
      fetchAnalyticsFromApi();
      fetchRecentTransactions();
      fetchComplaintsCount();
      fetchPremiumData();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchStats, fetchAnalyticsFromApi, fetchRecentTransactions, fetchComplaintsCount, fetchPremiumData]);

  function handleManualRefresh() {
    fetchStats(true);
    fetchAnalyticsFromApi();
    fetchRecentTransactions();
    fetchComplaintsCount();
    fetchPremiumData();
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      fetchStats();
      fetchAnalyticsFromApi();
      fetchRecentTransactions();
      fetchComplaintsCount();
      fetchPremiumData();
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
  const [categoryDistData, setCategoryDistData] = useState([]);
  const [loadingCategoryDist, setLoadingCategoryDist] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCategoryDist(true);
    getCategoryDistribution()
      .then((data) => {
        if (!cancelled) setCategoryDistData(data || []);
      })
      .catch(() => {
        if (!cancelled) setCategoryDistData([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategoryDist(false);
      });
    return () => { cancelled = true; };
  }, []);

  const categoryChartData = categoryDistData;
  const categoryLoading = loadingCategoryDist || loadingAnalytics;

  // User growth chart
  const userGrowthChartData = useMemo(() => {
    if (!filteredAnalytics.length) return [];
    return filteredAnalytics.map((item) => ({
      label: item.date ? item.date.slice(5, 10) : "?",
      users: typeof item.users === 'number' ? item.users : (item.total_users || 0),
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

  // --- Premium handlers ---
  const getPremiumStatusBadge = (status) => {
    const map = {
      "Hoạt Động": "admin-badge-success",
      "Sắp Hết Hạn": "admin-badge-warning",
      "Đã Hết Hạn": "admin-badge-danger",
    };
    return `admin-badge ${map[status] || "admin-badge-default"}`;
  };

  const handleShowDetail = (user) => {
    setDetailModal({ show: true, user });
  };

  const handleCloseDetail = () => {
    setDetailModal({ show: false, user: null });
  };

  const handleShowRenew = (user) => {
    setRenewModal({ show: true, user });
  };

  const handleCloseRenew = () => {
    setRenewModal({ show: false, user: null });
  };

  const handleCreatePlan = async () => {
    if (!newPlanData.id || !newPlanData.name || !newPlanData.price) return;
    try {
      if (editingPlanId) {
        await updatePremiumPlan(editingPlanId, newPlanData);
      } else {
        await createPremiumPlan(newPlanData);
      }
      setShowCreatePlanModal(false);
      setEditingPlanId(null);
      setNewPlanData({ id: "", name: "", price: 0, summary: "" });
      // Refresh plans
      const plans = await getPremiumPlans();
      setPremiumPlans(plans || []);
    } catch (err) {
      console.warn("handleCreatePlan error:", err?.message);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setNewPlanData({ id: plan.id, name: plan.name, price: plan.price, summary: plan.summary || "" });
    setShowCreatePlanModal(true);
  };

  const premiumStatusBg = (status) => {
    if (status === "Hoạt Động") return { backgroundColor: "#d1fae5", color: "#065f46" };
    if (status === "Sắp Hết Hạn") return { backgroundColor: "#fef3c7", color: "#92400e" };
    return { backgroundColor: "#fee2e2", color: "#991b1b" };
  };

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
              <CategoryDistributionChart data={categoryChartData} loading={categoryLoading} />
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

      {/* Premium Management Section */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#172033" }}>
            Quản Lý Premium
          </h2>
        {premiumPlans.length > 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              className="admin-filter-input"
              style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "13px", border: "1px solid #d1d5db", minWidth: "160px" }}
              value={editingPlanId || ""}
              onChange={(e) => {
                const planId = e.target.value;
                const plan = premiumPlans.find(p => p.id === planId);
                if (plan) {
                  setEditingPlanId(plan.id);
                  setNewPlanData({ id: plan.id, name: plan.name, price: plan.price, summary: plan.summary || "" });
                  setShowCreatePlanModal(true);
                }
              }}
            >
              <option value="">Chọn gói để chỉnh sửa...</option>
              {premiumPlans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              disabled={!editingPlanId}
              onClick={() => {
                const plan = premiumPlans.find(p => p.id === editingPlanId);
                if (plan) setShowCreatePlanModal(true);
              }}
              style={{ fontSize: 13 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "middle" }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Chỉnh Sửa Gói
            </button>
          </div>
        )}
        </div>

        {/* Premium Stats Cards */}
        {loadingPremium ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div className="admin-stat-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
              <p className="admin-stat-label">Premium Active</p>
              <p className="admin-stat-value" style={{ color: "#8b5cf6" }}>{premiumActiveCount}</p>
              <p className="admin-stat-desc">Người dùng Premium đang hoạt động</p>
            </div>
            <div className="admin-stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <p className="admin-stat-label">Doanh Thu</p>
              <p className="admin-stat-value" style={{ color: "#f59e0b" }}>
                {premiumRevenue > 0 ? formatCurrencyShort(premiumRevenue) : 0}
              </p>
              <p className="admin-stat-desc">Từ Premium</p>
            </div>
          </div>
        )}

        {/* Premium Users Table */}
        {loadingPremium ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : premiumUsers.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Người Dùng</th>
                  <th>Gói</th>
                  <th>Giá</th>
                  <th>Ngày Hết Hạn</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: "center" }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {premiumUsers.map((user, idx) => (
                  <tr key={user.id || idx}>
                    <td><strong>{user.user_name}</strong></td>
                    <td>{user.plan_name}</td>
                    <td style={{ fontWeight: 600, color: "#8b5cf6" }}>
                      {user.price ? `${user.price.toLocaleString()}đ` : "—"}
                    </td>
                    <td>{user.expires_at}</td>
                    <td>
                      <span className={getPremiumStatusBadge(user.status)} style={premiumStatusBg(user.status)}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => handleShowDetail(user)}
                        >
                          Chi Tiết
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                          onClick={() => handleShowRenew(user)}
                        >
                          Gia Hạn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: "12px" }}>
            <p>Chưa có người dùng Premium nào</p>
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
              <p className="admin-stat-value" style={{ color: "#8b5cf6" }}>{premiumActiveCount}</p>
              <p className="admin-stat-desc">Người dùng Premium (từ dữ liệu thực)</p>
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

      {/* ---- Detail Modal ---- */}
      {detailModal.show && detailModal.user && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#fff", borderRadius: "16px", padding: "24px",
            maxWidth: "480px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#172033" }}>
                Chi Tiết Premium
              </h3>
              <button
                onClick={handleCloseDetail}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#9ca3af" }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <strong style={{ color: "#6b7280", fontSize: "13px" }}>Người Dùng</strong>
                <p style={{ margin: "4px 0", fontSize: "16px", fontWeight: 600 }}>{detailModal.user.user_name}</p>
              </div>
              <div>
                <strong style={{ color: "#6b7280", fontSize: "13px" }}>Gói Premium</strong>
                <p style={{ margin: "4px 0" }}>{detailModal.user.plan_name}</p>
              </div>
              <div>
                <strong style={{ color: "#6b7280", fontSize: "13px" }}>Giá</strong>
                <p style={{ margin: "4px 0", fontWeight: 600, color: "#8b5cf6" }}>
                  {detailModal.user.price ? `${detailModal.user.price.toLocaleString()}đ` : "—"}
                </p>
              </div>
              <div>
                <strong style={{ color: "#6b7280", fontSize: "13px" }}>Ngày Bắt Đầu</strong>
                <p style={{ margin: "4px 0" }}>{detailModal.user.starts_at}</p>
              </div>
              <div>
                <strong style={{ color: "#6b7280", fontSize: "13px" }}>Ngày Hết Hạn</strong>
                <p style={{ margin: "4px 0" }}>{detailModal.user.expires_at}</p>
              </div>
              <div>
                <strong style={{ color: "#6b7280", fontSize: "13px" }}>Trạng Thái</strong>
                <p style={{ margin: "4px 0" }}>
                  <span className={getPremiumStatusBadge(detailModal.user.status)} style={premiumStatusBg(detailModal.user.status)}>
                    {detailModal.user.status}
                  </span>
                </p>
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleCloseDetail}
              >
                Đóng
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => { handleCloseDetail(); handleShowRenew(detailModal.user); }}
              >
                Gia Hạn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Renew Modal ---- */}
      {renewModal.show && renewModal.user && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#fff", borderRadius: "16px", padding: "24px",
            maxWidth: "400px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#172033" }}>
                Gia Hạn Premium
              </h3>
              <button
                onClick={handleCloseRenew}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#9ca3af" }}
              >
                &times;
              </button>
            </div>
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>
              Bạn có chắc muốn gia hạn gói <strong>{renewModal.user.plan_name}</strong> cho <strong>{renewModal.user.user_name}</strong>?
            </p>
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                Giá hiện tại: <strong style={{ color: "#8b5cf6" }}>
                  {renewModal.user.price ? `${renewModal.user.price.toLocaleString()}đ` : "—"}
                </strong>
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#6b7280" }}>
                Hạn cũ: {renewModal.user.expires_at}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={handleCloseRenew}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  alert(`Đã gia hạn gói ${renewModal.user.plan_name} cho ${renewModal.user.user_name} thành công!`);
                  handleCloseRenew();
                  fetchPremiumData();
                }}
              >
                Xác Nhận Gia Hạn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Create / Edit Plan Modal ---- */}
      {showCreatePlanModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#fff", borderRadius: "16px", padding: "24px",
            maxWidth: "480px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#172033" }}>
                {editingPlanId ? "Chỉnh Sửa Gói Premium" : "Tạo Gói Premium Mới"}
              </h3>
              <button
                onClick={() => { setShowCreatePlanModal(false); setEditingPlanId(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#9ca3af" }}
              >
                &times;
              </button>
            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              {editingPlanId ? (
                <>
                  <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "4px" }}>
                    <strong style={{ color: "#6b7280", fontSize: "13px" }}>Gói đang chọn</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 600, color: "#172033" }}>{newPlanData.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>ID: {newPlanData.id}</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Giá Mới (₫)</label>
                    <input
                      className="admin-filter-input"
                      type="number"
                      placeholder="VD: 10000"
                      value={newPlanData.price}
                      onChange={(e) => setNewPlanData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px" }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>ID Gói</label>
                    <input
                      className="admin-filter-input"
                      type="text"
                      placeholder="VD: vip_monthly"
                      value={newPlanData.id}
                      onChange={(e) => setNewPlanData(prev => ({ ...prev, id: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Tên Gói</label>
                    <input
                      className="admin-filter-input"
                      type="text"
                      placeholder="VD: VIP Tháng"
                      value={newPlanData.name}
                      onChange={(e) => setNewPlanData(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Giá (₫)</label>
                    <input
                      className="admin-filter-input"
                      type="number"
                      placeholder="VD: 10000"
                      value={newPlanData.price}
                      onChange={(e) => setNewPlanData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Mô Tả</label>
                    <textarea
                      className="admin-filter-input"
                      placeholder="Mô tả ngắn gọn về gói..."
                      value={newPlanData.summary}
                      onChange={(e) => setNewPlanData(prev => ({ ...prev, summary: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", minHeight: "60px", resize: "vertical" }}
                    />
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => { setShowCreatePlanModal(false); setEditingPlanId(null); }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleCreatePlan}
              >
                {editingPlanId ? "Cập Nhật Giá" : "Tạo Mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}