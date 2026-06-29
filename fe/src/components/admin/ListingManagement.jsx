import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext"; // chỉnh đường dẫn nếu cần
import { getListings, updateListingStatus, rejectListing } from "../../services/listingService";

export default function ListingManagement() {
  const { token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalElements, setTotalElements] = useState(0);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 8;

  const statusParam = filterStatus === "all" ? null : filterStatus;

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings(currentPage, pageSize, statusParam, searchTerm, sortConfig);
        setListings(data.content);
        setTotalElements(data.totalElements);
      } catch (err) {
        setError("Failed to fetch listings.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [currentPage, pageSize, filterStatus, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(0);
  };

  const handleApprove = async (id) => {
    try {
      await updateListingStatus(id, "active", token);
      const data = await getListings(currentPage, pageSize, statusParam, searchTerm, sortConfig);
      setListings(data.content);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError("Failed to approve listing.");
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectListing(id, "Admin rejected", token);
      const data = await getListings(currentPage, pageSize, statusParam, searchTerm, sortConfig);
      setListings(data.content);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError("Failed to reject listing.");
      console.error(err);
    }
  };

  const statusColor = (status) => {
    switch(status) {
      case "active": return "admin-badge-success";
      case "pending": return "admin-badge-warning";
      case "flagged": return "admin-badge-danger";
      default: return "admin-badge-info";
    }
  };

  const statusText = (status) => {
    switch(status) {
      case "active": return "Đã Duyệt";
      case "pending": return "Chờ Duyệt";
      case "flagged": return "Vi Phạm";
      default: return status;
    }
  };

  const getSortSymbol = (key) => {
    if (sortConfig.key !== key) return "^v";
    return sortConfig.direction === "asc" ? "^" : "v";
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Quản Lý Listing/Sách</h1>
        <div className="admin-actions">
          <button className="admin-btn admin-btn-secondary">Báo Cáo</button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-search-wrap">
          <svg className="admin-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            className="admin-filter-input with-search"
            placeholder="Tìm theo tên sách..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>
        <select
          className="admin-filter-select"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(0);
          }}
        >
          <option value="all">Tất Cả Trạng Thái</option>
          <option value="active">Đã Duyệt</option>
          <option value="pending">Chờ Duyệt</option>
          <option value="flagged">Vi Phạm</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("title")}>Tên Sách {getSortSymbol("title")}</th>
              <th onClick={() => handleSort("seller")}>Người Bán {getSortSymbol("seller")}</th>
              <th onClick={() => handleSort("category")}>Danh Mục {getSortSymbol("category")}</th>
              <th onClick={() => handleSort("price")}>Giá {getSortSymbol("price")}</th>
              <th onClick={() => handleSort("status")}>Trạng Thái {getSortSymbol("status")}</th>
              <th onClick={() => handleSort("views")}>Lượt Xem {getSortSymbol("views")}</th>
              <th onClick={() => handleSort("createdAt")}>Ngày Tạo {getSortSymbol("createdAt")}</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Loading listings...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center text-red-500">{error}</td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">No listings found.</td>
              </tr>
            ) : (
              listings.map(listing => (
                <tr key={listing.id}>
                  <td><strong>{listing.title}</strong></td>
                  <td>{listing.sellerName}</td>
                  <td>{listing.categoryName}</td>
                  <td style={{ fontWeight: 600 }}>{listing.price.toLocaleString("vi-VN")}đ</td>
                  <td>
                    <span className={`admin-badge ${statusColor(listing.status)}`}>
                      {statusText(listing.status)}
                    </span>
                  </td>
                  <td>{listing.viewCount}</td>
                  <td>{new Date(listing.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: "6px 10px", fontSize: "12px" }}>
                        Xem
                      </button>
                      {listing.status === "pending" && (
                        <>
                          <button
                            className="admin-btn admin-btn-success"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => handleApprove(listing.id)}
                          >
                            Duyệt
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => handleReject(listing.id)}
                          >
                            Từ Chối
                          </button>
                        </>
                      )}
                      {listing.status === "flagged" && (
                        <button
                          className="admin-btn admin-btn-danger"
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                          onClick={() => handleReject(listing.id)}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "16px", color: "#56647e", fontSize: "14px" }}>
        Hiển thị {listings.length} / {totalElements} listing
      </div>

      <div className="admin-pagination">
        <button
          className="admin-btn"
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
        >
          Trước
        </button>
        <span>Trang {currentPage + 1} / {totalPages}</span>
        <button
          className="admin-btn"
          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
          disabled={currentPage === totalPages - 1}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
