import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { transactionApi } from "../services/transactionApi";
import { formatPrice } from "../utils/formatters";

const statusConfig = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  awaiting_meet: { label: "Chờ gặp mặt", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Hoàn tất", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
  refunded: { label: "Đã hoàn tiền", color: "bg-slate-100 text-slate-700" },
};

export default function MyTransactionsScreen() {
  const { userData, token } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userData || !token) {
      setLoading(false);
      return;
    }
    const fetchTransactions = async () => {
      try {
        setError(null);
        const data = await transactionApi.getTransactions(token);
        console.log("Transactions loaded:", data?.length || 0, "items");
        setTransactions(data || []);
      } catch (err) {
        console.error("fetch transactions error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userData, token]);

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-slate-600 mb-6">Vui lòng đăng nhập để xem giao dịch.</p>
        <Link to="/" className="vinted-btn-outline w-auto px-8 mx-auto">Về trang chủ</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không thể tải giao dịch</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="vinted-btn-primary px-6 text-sm">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-6">
        <p className="text-sm font-semibold text-teal-700 uppercase tracking-wider mb-1">Quản lý</p>
        <h1 className="text-2xl font-bold text-slate-900">Giao dịch của tôi</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi các giao dịch mua & bán sách của bạn</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 font-medium">Chưa có giao dịch nào</p>
            <p className="text-slate-400 text-xs mt-1">Khi bạn mua hoặc bán sách, giao dịch sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Phân loại</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Mã GD</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Sách</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Đối tác</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Số tiền</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Trạng thái</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => {
                  const isBuyer = String(txn.buyerId) === String(userData.id) || String(txn.buyer_id) === String(userData.id);
                  const status = statusConfig[txn.status] || { label: txn.status, color: "bg-slate-100 text-slate-600" };
                  const rawDate = txn.createdAt || txn.created_at;
                  const formattedDate = rawDate
                    ? new Date(rawDate).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—";
                  const rawAmount = txn.amount;
                  const displayAmount = rawAmount
                    ? `${isBuyer ? "-" : "+"}${formatPrice(rawAmount)}`
                    : "—";

                  const isBoost = txn.type === 'boost';

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        {isBoost ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Dịch vụ
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            isBuyer
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {isBuyer ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                                Mua
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Bán
                              </>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{txn.id ? txn.id.substring(0, 8) + "..." : "—"}</td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900 text-sm">{txn.book || "—"}</span>
                        {isBoost && (
                          <span className="text-xs text-violet-500 ml-1">(dịch vụ đẩy tin)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-sm">
                        {isBoost ? (
                          <span className="text-slate-400 italic">—</span>
                        ) : (
                          txn.partner || "—"
                        )}
                      </td>
                      <td className={`px-5 py-4 font-semibold whitespace-nowrap ${isBuyer ? "text-red-500" : "text-green-600"}`}>{displayAmount}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{formattedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
