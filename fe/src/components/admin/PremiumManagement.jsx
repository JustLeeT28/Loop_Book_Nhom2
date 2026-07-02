import { useState, useEffect, useCallback } from "react";
import { getPremiumUsers, getPremiumPlans, getPremiumRevenue, getPremiumActiveCount, createPremiumPlan, updatePremiumPlan } from "../../services/admin";

function formatCurrencyShort(value) {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${Math.round(value / 1000)}K`;
}

export default function PremiumManagement() {
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [premiumActiveCount, setPremiumActiveCount] = useState(0);
  const [premiumRevenue, setPremiumRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const [detailModal, setDetailModal] = useState({ show: false, user: null });
  const [renewModal, setRenewModal] = useState({ show: false, user: null });
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [newPlanData, setNewPlanData] = useState({ id: "", name: "", price: 0, summary: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusBg = (status) => {
    if (status === "Hoạt Động") return { backgroundColor: "#d1fae5", color: "#065f46" };
    if (status === "Sắp Hết Hạn") return { backgroundColor: "#fef3c7", color: "#92400e" };
    return { backgroundColor: "#fee2e2", color: "#991b1b" };
  };

  const getPremiumStatusBadge = (status) => {
    const map = {
      "Hoạt Động": "admin-badge-success",
      "Sắp Hết Hạn": "admin-badge-warning",
      "Đã Hết Hạn": "admin-badge-danger",
    };
    return `admin-badge ${map[status] || "admin-badge-default"}`;
  };

  const handleShowDetail = (user) => setDetailModal({ show: true, user });
  const handleCloseDetail = () => setDetailModal({ show: false, user: null });

  const handleShowRenew = (user) => setRenewModal({ show: true, user });
  const handleCloseRenew = () => setRenewModal({ show: false, user: null });

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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Quản Lý Premium</h1>
        {premiumPlans.length > 0 && (
          <div className="admin-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              className="admin-filter-input"
              style={{ padding: "8px 12px", borderRadius: "8px", fontSize: "13px", border: "1px solid #d1d5db", minWidth: "180px" }}
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
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        {loading ? (
          <>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Premium Active</p>
              <p className="admin-stat-value" style={{ color: "#d1d5db" }}>—</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Doanh Thu</p>
              <p className="admin-stat-value" style={{ color: "#d1d5db" }}>—</p>
              <p className="admin-stat-desc">Từ Premium</p>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Premium Users Table */}
      {loading ? (
        <div style={{ display: "grid", gap: "12px" }}>
          <div className="admin-stat-card" style={{ height: "60px" }} />
          <div className="admin-stat-card" style={{ height: "60px" }} />
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
                    <span className={getPremiumStatusBadge(user.status)} style={statusBg(user.status)}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        onClick={() => handleShowDetail(user)}
                      >
                        Chi Tiết
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
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
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af", border: "1px dashed #d1d5db", borderRadius: "12px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p style={{ fontSize: "15px", fontWeight: 500 }}>Chưa có người dùng Premium nào</p>
          <p style={{ fontSize: "13px" }}>Dữ liệu sẽ được đồng bộ từ hệ thống</p>
        </div>
      )}

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
                  <span className={getPremiumStatusBadge(detailModal.user.status)} style={statusBg(detailModal.user.status)}>
                    {detailModal.user.status}
                  </span>
                </p>
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCloseDetail}>Đóng</button>
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
              <button onClick={handleCloseRenew} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#9ca3af" }}>
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
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCloseRenew}>Hủy</button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  alert(`Đã gia hạn gói ${renewModal.user.plan_name} cho ${renewModal.user.user_name} thành công!`);
                  handleCloseRenew();
                  fetchData();
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