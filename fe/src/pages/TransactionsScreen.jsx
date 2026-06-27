import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { transactionApi } from "../services/transactionApi";
import { formatPrice } from "../utils/formatters";

const statusConfig = {
  "pending": { label: "Chờ gặp mặt", color: "bg-yellow-100 text-yellow-700" },
  "confirmed": { label: "Xác nhận TT", color: "bg-blue-100 text-blue-700" },
  "completed": { label: "Hoàn tất", color: "bg-green-100 text-green-700" },
};

const DEFAULT_STATUS = { label: "Khác", color: "bg-slate-100 text-slate-600" };

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "buy", label: "Mua" },
  { id: "sell", label: "Bán" },
  { id: "service", label: "Gói dịch vụ" },
];

function TransactionCard({ item, isCompleted }) {
  const status = statusConfig[item.status] || DEFAULT_STATUS;
  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
        {(item.partner || "?").charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{item.book}</p>
        <p className="text-xs text-slate-500 mt-0.5">Với <span className="font-medium text-slate-700">{item.partner}</span></p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
          <span className="text-xs text-slate-400">{item.when}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className={`font-bold text-sm ${isCompleted ? "text-green-600" : "text-slate-900"}`}>{item.amount}</span>
        <div className="flex gap-2">
          {!isCompleted && (
            <button className="text-xs text-teal-700 border border-teal-700 px-2 py-0.5 rounded-full font-semibold hover:bg-teal-50 transition-colors">
              Xem chi tiết
            </button>
          )}
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-report-modal', { detail: item }))}
            className="text-xs text-orange-600 border border-orange-600 px-2 py-0.5 rounded-full font-semibold hover:bg-orange-50 transition-colors">
            Khiếu nại
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ item }) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{item.book}</p>
        <p className="text-xs text-slate-500 mt-0.5">Gói <span className="font-medium text-slate-700">{item.partner}</span></p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Đã kích hoạt</span>
          <span className="text-xs text-slate-400">{item.when}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="font-bold text-sm text-violet-600">{item.amount}</span>
      </div>
    </div>
  );
}

function formatWhen(rawDate) {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Hôm nay, ${time}`;
    if (isTomorrow) return `Ngày mai, ${time}`;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return rawDate;
  }
}

export default function TransactionsScreen() {
  const { userData, token } = useAuth();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reportReason, setReportReason] = useState("");
  
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const data = await transactionApi.getTransactions(token);
        const mapped = (data || []).map((t) => {
          const isComp = t.isCompleted || t.status === "completed";
          const isBoost = t.type === "boost";
          const isBuyer = String(t.buyerId) === String(userData?.id);
          return {
            id: t.id,
            book: t.book || "",
            partner: t.partner || "",
            status: t.status || "pending",
            amount: formatPrice(t.amount),
            when: formatWhen(t.whenTime || t.createdAt),
            isCompleted: isComp,
            isBoost,
            role: isBoost ? "service" : isBuyer ? "buy" : "sell",
          };
        });
        setAllTransactions(mapped);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, userData?.id]);

  // Listen to custom event to open modal
  useEffect(() => {
    const handleOpenModal = (e) => {
      setSelectedTransaction(e.detail);
      setReportModalOpen(true);
    };
    window.addEventListener('open-report-modal', handleOpenModal);
    return () => window.removeEventListener('open-report-modal', handleOpenModal);
  }, []);

  const handleSubmitReport = () => {
    if (!reportReason.trim()) return alert("Vui lòng nhập lý do khiếu nại.");
    alert(`Đã gửi báo cáo khiếu nại cho giao dịch: ${selectedTransaction?.book}\nLý do: ${reportReason}`);
    setReportModalOpen(false);
    setReportReason("");
    setSelectedTransaction(null);
  };

  // Filter by tab
  let filtered = allTransactions;
  if (activeTab !== "all") {
    filtered = filtered.filter(t => t.role === activeTab);
  }
  
  // Sort
  if (sortBy === "recent") {
    filtered = [...filtered].sort((a, b) => (b.when || "").localeCompare(a.when || ""));
  } else if (sortBy === "oldest") {
    filtered = [...filtered].sort((a, b) => (a.when || "").localeCompare(b.when || ""));
  }

  const countByRole = (role) => allTransactions.filter(t => t.role === role).length;

  if (!token) {
    return (
      <div className="py-6 max-w-5xl mx-auto text-center">
        <div className="py-16">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-slate-500 font-medium">Vui lòng đăng nhập để xem giao dịch</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto">
      {/* ── Sidebar Bộ lọc ── */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <div className="sticky top-24 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Bộ lọc</h2>

          <div className="bg-white border border-slate-100 rounded-xl p-2">
            {TABS.map((tab) => {
              const count = tab.id === "all" 
                ? allTransactions.length 
                : countByRole(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                    activeTab === tab.id
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.id === "buy" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    )}
                    {tab.id === "sell" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {tab.id === "service" && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    )}
                    {tab.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-500"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold text-teal-700 uppercase tracking-wider mb-1">Theo dõi đơn hàng</p>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Lịch sử giao dịch</h1>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 rounded-lg bg-white px-3 py-2 font-medium text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 text-sm cursor-pointer transition-colors hover:border-slate-300"
            >
              <option value="recent">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
            <p className="text-2xl font-extrabold text-slate-900">{countByRole("buy")}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Mua</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
            <p className="text-2xl font-extrabold text-orange-600">{countByRole("sell")}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Bán</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-slate-300 transition-colors">
            <p className="text-2xl font-extrabold text-violet-600">{countByRole("service")}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Dịch vụ</p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-sm font-medium">
                {activeTab === "all" 
                  ? "Chưa có giao dịch nào"
                  : activeTab === "buy"
                    ? "Chưa có giao dịch mua nào"
                    : activeTab === "sell"
                      ? "Chưa có giao dịch bán nào"
                      : "Chưa mua gói dịch vụ nào"}
              </p>
            </div>
          ) : (
            filtered.map((item) =>
              item.isBoost ? (
                <ServiceCard key={item.id} item={item} />
              ) : (
                <TransactionCard key={item.id} item={item} isCompleted={item.isCompleted} />
              )
            )
          )}
        </div>

        {/* Modal Khiếu Nại */}
        {reportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative">
              <button onClick={() => setReportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Gửi Báo Cáo Khiếu Nại</h2>
              <p className="text-sm text-slate-500 mb-5">
                Bạn đang khiếu nại giao dịch sách <span className="font-semibold text-slate-800">{selectedTransaction?.book}</span> với <span className="font-semibold text-slate-800">{selectedTransaction?.partner}</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Lý do khiếu nại / tranh chấp</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 min-h-[100px]"
                  placeholder="Vui lòng mô tả chi tiết vấn đề (ví dụ: Sách bị rách, giao sai sách, không đúng như mô tả...)"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                ></textarea>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Hủy bỏ
                </button>
                <button onClick={handleSubmitReport} className="px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                  Gửi Báo Cáo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}