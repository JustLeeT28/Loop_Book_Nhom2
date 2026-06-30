import { useEffect, useState } from "react";
import { getComplaints, resolveComplaint } from "../../services/admin";

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolveStatus, setResolveStatus] = useState("resolved_buyer");
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load complaints
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getComplaints();
        setComplaints(result.data || []);
      } catch (err) {
        console.error("Failed to load complaints:", err);
        setError("Không thể tải danh sách khiếu nại");
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  const openModal = (complaint) => {
    setSelectedComplaint(complaint);
    setResolveStatus("resolved_buyer");
    setResolutionNote("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedComplaint(null);
  };

  const handleResolve = async () => {
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      await resolveComplaint(selectedComplaint.id, resolveStatus, resolutionNote);
      // Refresh list
      const result = await getComplaints();
      setComplaints(result.data || []);
      closeModal();
    } catch (err) {
      setError(err?.message || "Không thể giải quyết khiếu nại");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status) => {
    switch(status) {
      case "resolved":
      case "resolved_seller":
      case "resolved_both":
        return "admin-badge-success";
      case "resolved_buyer":
        return "admin-badge-warning";
      case "pending": return "admin-badge-warning";
      case "open": return "admin-badge-danger";
      default: return "admin-badge-info";
    }
  };

  const statusText = (status) => {
    switch(status) {
      case "resolved": return "Đã xử lý";
      case "resolved_buyer": return "Có lợi cho người mua - chờ trả sách";
      case "resolved_seller": return "Có lợi cho người bán";
      case "resolved_both": return "Hoà giải";
      case "dismissed": return "Từ chối";
      case "pending": return "Chờ xử lý";
      case "open": return "Mở";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>Quản Lý Khiếu Nại</h1>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#56647e" }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Quản Lý Khiếu Nại</h1>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Tổng Khiếu Nại</p>
          <p className="admin-stat-value">{complaints.length}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Chưa Xử Lý</p>
          <p className="admin-stat-value" style={{ color: "#d94c24" }}>
            {complaints.filter(d => d.status === "pending" || d.status === "open").length}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
          <button 
            style={{ marginLeft: "12px", background: "none", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", padding: "2px 8px", cursor: "pointer" }}
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Complaints Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tiêu Đề</th>
              <th>Người Khiếu Nại</th>
              <th>Bị Khiếu Nại</th>
              <th>Loại</th>
              <th>Trạng Thái</th>
              <th>Ngày</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(complaint => (
              <tr key={complaint.id}>
                <td><strong>{complaint.title}</strong></td>
                <td>{complaint.complainantName || complaint.complainant_name}</td>
                <td>{complaint.defendantName || complaint.defendant_name}</td>
                <td>{complaint.type === "dispute" ? "Tranh chấp" : complaint.type}</td>
                <td>
                  <span className={`admin-badge ${statusColor(complaint.status)}`}>
                    {statusText(complaint.status)}
                  </span>
                </td>
                <td>{(complaint.createdAt || complaint.created_at)?.split('T')[0] || "—"}</td>
                <td>
                  <button 
                    className="admin-btn admin-btn-primary" 
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => openModal(complaint)}
                    disabled={complaint.status !== "pending" && complaint.status !== "open"}
                  >
                    {complaint.status === "pending" || complaint.status === "open" ? "Giải Quyết" : 
                     complaint.status === "resolved_buyer" ? "Chờ người bán xác nhận" : "Đã Xử Lý"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resolve Modal */}
      {showModal && selectedComplaint && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Giải Quyết Khiếu Nại</h2>
              <button 
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 4px", fontWeight: "600", fontSize: "14px" }}>{selectedComplaint.title}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                Người khiếu nại: <strong>{selectedComplaint.complainantName || selectedComplaint.complainant_name}</strong> | 
                Bị khiếu nại: <strong>{selectedComplaint.defendantName || selectedComplaint.defendant_name}</strong>
              </p>
            </div>

            {/* Kết quả giải quyết */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Kết quả giải quyết</label>
              <select 
                style={selectStyle}
                value={resolveStatus} 
                onChange={(e) => setResolveStatus(e.target.value)}
                disabled={submitting}
              >
                <option value="resolved_buyer">Có lợi cho người mua (chờ người bán xác nhận trả sách)</option>
                <option value="resolved_seller">Có lợi cho người bán</option>
                <option value="dismissed">Từ chối khiếu nại</option>
              </select>
              {resolveStatus === "resolved_buyer" && (
                <p style={{ fontSize: "12px", color: "#92400e", margin: "4px 0 0" }}>
                  Sau khi admin chọn kết quả này, người bán sẽ cần xác nhận đã nhận lại sách trên hệ thống thì tiền mới được hoàn trả cho người mua.
                </p>
              )}
            </div>

            {/* Ghi chú giải quyết */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Ghi chú giải quyết</label>
              <textarea
                style={{ ...selectStyle, minHeight: "80px", resize: "vertical" }}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Nhập ghi chú cho kết quả giải quyết..."
                disabled={submitting}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleResolve}
                disabled={submitting}
              >
                {submitting ? "Đang xử lý..." : "Xác Nhận Giải Quyết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles for modal
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  borderRadius: "12px",
  padding: "24px",
  width: "520px",
  maxWidth: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

const labelStyle = {
  display: "block",
  fontWeight: "600",
  fontSize: "14px",
  marginBottom: "6px",
  color: "#374151",
};

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  background: "#fff",
  color: "#111827",
  boxSizing: "border-box",
};