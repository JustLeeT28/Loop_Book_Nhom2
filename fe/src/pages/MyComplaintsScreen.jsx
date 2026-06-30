import { useEffect, useState } from "react";
import { getMyComplaints, getComplaintsAgainstMe, confirmBookReturned } from "../services/admin";

const statusConfig = {
  "pending": { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  "open": { label: "Mở", color: "bg-orange-100 text-orange-700" },
  "resolved_buyer": { label: "Chờ người bán xác nhận trả sách", color: "bg-indigo-100 text-indigo-700" },
  "resolved_seller": { label: "Có lợi cho người bán", color: "bg-blue-100 text-blue-700" },
  "resolved_both": { label: "Hoà giải", color: "bg-purple-100 text-purple-700" },
  "resolved": { label: "Đã xử lý", color: "bg-green-100 text-green-700" },
  "dismissed": { label: "Từ chối", color: "bg-red-100 text-red-700" },
};

const DEFAULT_STATUS = { label: "Khác", color: "bg-slate-100 text-slate-600" };

const TABS = [
  { id: "my", label: "Tôi đã gửi" },
  { id: "against", label: "Khiếu nại về tôi" },
];

export default function MyComplaintsScreen() {
  const [activeTab, setActiveTab] = useState("my");
  const [myComplaints, setMyComplaints] = useState([]);
  const [againstMe, setAgainstMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [myRes, againstRes] = await Promise.all([
        getMyComplaints(),
        getComplaintsAgainstMe(),
      ]);
      setMyComplaints(Array.isArray(myRes) ? myRes : []);
      setAgainstMe(Array.isArray(againstRes) ? againstRes : []);
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmReturn = async (complaintId) => {
    setConfirmingId(complaintId);
    try {
      await confirmBookReturned(complaintId);
      await loadData();
    } catch (err) {
      setError(err?.message || "Không thể xác nhận trả sách");
    } finally {
      setConfirmingId(null);
    }
  };

  const currentList = activeTab === "my" ? myComplaints : againstMe;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Khiếu Nại Của Tôi</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({tab.id === "my" ? myComplaints.length : againstMe.length})
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Đang tải dữ liệu...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 font-medium">Không có khiếu nại nào</p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === "my" ? "Bạn chưa gửi khiếu nại nào." : "Chưa có ai khiếu nại bạn."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((complaint) => {
            const status = statusConfig[complaint.status] || DEFAULT_STATUS;
            return (
              <div
                key={complaint.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base mb-1">
                      {complaint.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {activeTab === "my" ? (
                        <span>
                          Bị khiếu nại: <strong className="text-slate-700">{complaint.defendantName || "—"}</strong>
                        </span>
                      ) : (
                        <span>
                          Người khiếu nại: <strong className="text-slate-700">{complaint.complainantName || "—"}</strong>
                        </span>
                      )}
                      <span>
                        Loại: <strong className="text-slate-700">
                          {complaint.type === "dispute" ? "Tranh chấp" : complaint.type || "—"}
                        </strong>
                      </span>
                      <span>
                        Ngày: <strong className="text-slate-700">
                          {complaint.createdAt ? complaint.createdAt.split("T")[0] : "—"}
                        </strong>
                      </span>
                    </div>
                    {complaint.description && (
                      <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                        {complaint.description}
                      </p>
                    )}
                    {complaint.resolutionNote && (
                      <div className="mt-2 text-sm text-indigo-700 bg-indigo-50 rounded-lg p-3">
                        <span className="font-semibold">Kết quả: </span>
                        {complaint.resolutionNote}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                    {complaint.status === "resolved_buyer" && activeTab === "against" && (
                      <button
                        onClick={() => handleConfirmReturn(complaint.id)}
                        disabled={confirmingId === complaint.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors disabled:opacity-50"
                      >
                        {confirmingId === complaint.id ? "Đang xử lý..." : "Xác nhận đã trả sách"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}