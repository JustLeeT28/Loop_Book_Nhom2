import { useEffect, useState } from "react";
import { getUsers, updateUserStatus } from "../../services/admin";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  // Load users from Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Map Supabase columns to component column names
        const filters = filterStatus !== "all" ? { status: filterStatus } : {};
        if (searchTerm) {
          filters.search = searchTerm;
        }
        
        const result = await getUsers(filters);
        const mappedData = (result.data || []).map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          listings: user.listings_count,
          sales: user.sales_count,
          status: user.status,
          joinDate: user.join_date,
        }));
        
        setUsers(mappedData);
      } catch (err) {
        console.error("Failed to load users:", err);
        setError("Không thể tải danh sách người dùng");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [filterStatus, searchTerm]);

  const handleSuspend = async (id) => {
    try {
      await updateUserStatus(id, "suspended");
      // Refresh users list
      const filters = filterStatus !== "all" ? { status: filterStatus } : {};
      if (searchTerm) filters.search = searchTerm;
      const result = await getUsers(filters);
      const mappedData = (result.data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        listings: user.listings_count,
        sales: user.sales_count,
        status: user.status,
        joinDate: user.join_date,
      }));
      setUsers(mappedData);
    } catch (err) {
      console.error("Failed to suspend user:", err);
      setError("Không thể khóa người dùng");
    }
  };

  const handleActivate = async (id) => {
    try {
      await updateUserStatus(id, "active");
      // Refresh users list
      const filters = filterStatus !== "all" ? { status: filterStatus } : {};
      if (searchTerm) filters.search = searchTerm;
      const result = await getUsers(filters);
      const mappedData = (result.data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        listings: user.listings_count,
        sales: user.sales_count,
        status: user.status,
        joinDate: user.join_date,
      }));
      setUsers(mappedData);
    } catch (err) {
      console.error("Failed to activate user:", err);
      setError("Không thể kích hoạt người dùng");
    }
  };

  const statusColor = (status) => {
    switch(status) {
      case "active": return "admin-badge-success";
      case "inactive": return "admin-badge-warning";
      case "suspended": return "admin-badge-danger";
      default: return "admin-badge-info";
    }
  };

  const statusText = (status) => {
    switch(status) {
      case "active": return "Hoạt động";
      case "inactive": return "Không hoạt động";
      case "suspended": return "Đã khóa";
      default: return status;
    }
  };

  // User detail modal
  const renderUserModal = () => {
    if (!viewingUser) return null;

    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onClick={() => setViewingUser(null)}
      >
        <div
          style={{
            background: "#fff", borderRadius: "12px",
            padding: "28px", maxWidth: "480px", width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
              Chi Tiết Người Dùng
            </h2>
            <button
              onClick={() => setViewingUser(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "22px", color: "#94a3b8", padding: "4px",
              }}
            >
              &times;
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px 16px", fontSize: "14px" }}>
            <span style={{ color: "#64748b", fontWeight: 500 }}>ID</span>
            <span style={{ color: "#0f172a" }}>{viewingUser.id}</span>

            <span style={{ color: "#64748b", fontWeight: 500 }}>Tên</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{viewingUser.name}</span>

            <span style={{ color: "#64748b", fontWeight: 500 }}>Email</span>
            <span style={{ color: "#0f172a" }}>{viewingUser.email}</span>

            <span style={{ color: "#64748b", fontWeight: 500 }}>Số Listing</span>
            <span style={{ color: "#0f172a" }}>{viewingUser.listings}</span>

            <span style={{ color: "#64748b", fontWeight: 500 }}>Giao Dịch</span>
            <span style={{ color: "#0f172a" }}>{viewingUser.sales}</span>

            <span style={{ color: "#64748b", fontWeight: 500 }}>Trạng Thái</span>
            <span>
              <span className={`admin-badge ${statusColor(viewingUser.status)}`}>
                {statusText(viewingUser.status)}
              </span>
            </span>

            <span style={{ color: "#64748b", fontWeight: 500 }}>Ngày Tham Gia</span>
            <span style={{ color: "#0f172a" }}>{viewingUser.joinDate}</span>
          </div>

          <div style={{ marginTop: "24px", textAlign: "right" }}>
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setViewingUser(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>Quản Lý Người Dùng</h1>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#56647e" }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>Quản Lý Người Dùng</h1>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#dc2626" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Quản Lý Người Dùng</h1>
        <div className="admin-actions">
          <button className="admin-btn admin-btn-primary">Thêm Người Dùng</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-filter-search-wrap">
          <svg className="admin-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            className="admin-filter-input with-search" 
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="admin-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất Cả Trạng Thái</option>
          <option value="active">Hoạt Động</option>
          <option value="inactive">Không Hoạt Động</option>
          <option value="suspended">Đã Khóa</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Listing</th>
              <th>Giao Dịch</th>
              <th>Trạng Thái</th>
              <th>Tham Gia</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.listings}</td>
                <td>{user.sales}</td>
                <td>
                  <span className={`admin-badge ${statusColor(user.status)}`}>
                    {statusText(user.status)}
                  </span>
                </td>
                <td>{user.joinDate}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      className="admin-btn admin-btn-secondary" 
                      style={{ padding: "6px 10px", fontSize: "12px" }}
                      onClick={() => setViewingUser(user)}
                    >
                      Xem
                    </button>
                    {user.status === "active" && (
                      <button 
                        className="admin-btn admin-btn-danger" 
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        onClick={() => handleSuspend(user.id)}
                      >
                        Khóa
                      </button>
                    )}
                    {user.status === "suspended" && (
                      <button 
                        className="admin-btn admin-btn-success" 
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        onClick={() => handleActivate(user.id)}
                      >
                        Kích Hoạt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "16px", color: "#56647e", fontSize: "14px" }}>
        Hiển thị {users.length} người dùng
      </div>

      {/* User Detail Modal */}
      {renderUserModal()}
    </div>
  );
}