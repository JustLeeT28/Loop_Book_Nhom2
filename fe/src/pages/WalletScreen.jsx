import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { walletApi } from "../services/walletApi";
import { transactionApi } from "../services/transactionApi";
import { formatPrice } from "../utils/formatters";

export default function WalletScreen() {
  const { userData, token } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || !token) {
      setLoading(false);
      return;
    }
    const fetchWallet = async () => {
      try {
        const walletData = await walletApi.getWallet(token);
        setWallet(walletData);

        const txnData = await transactionApi.getTransactions(token);
        setTransactions(txnData || []);
      } catch (err) {
        console.error("wallet/transaction fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [userData, token]);

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-slate-600 mb-6">Vui lòng đăng nhập để xem ví tiền.</p>
        <Link to="/" className="vinted-btn-outline w-auto px-8 mx-auto">Về trang chủ</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700" />
      </div>
    );
  }

  const balance = wallet?.balance || 0;

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700 uppercase tracking-wider mb-1">Tài chính</p>
          <h1 className="text-2xl font-bold text-slate-900">Ví & Doanh thu</h1>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12l7-7 7 7" /></svg>
            Nạp ví
          </button>
        </div>
      </div>

      <div className="bg-teal-700 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <p className="text-teal-200 text-sm font-medium mb-2">Số dư khả dụng</p>
          <p className="text-4xl font-extrabold tracking-tight">{formatPrice(balance)}</p>
        </div>
        <div className="flex gap-6 md:border-l md:border-teal-600 md:pl-8">
          <div>
            <p className="text-teal-200 text-xs font-medium mb-1">Tổng thu</p>
            <p className="text-xl font-bold text-green-300">+{formatPrice(wallet?.totalIn || 0)}</p>
          </div>
          <div>
            <p className="text-teal-200 text-xs font-medium mb-1">Tổng chi</p>
            <p className="text-xl font-bold text-red-300">-{formatPrice(wallet?.totalOut || 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Lịch sử giao dịch</h2>
          <Link to="/giao-dich" className="text-sm text-teal-700 font-semibold hover:underline">
            Xem tất cả
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
              {transactions.slice(0, 10).map((txn) => {
              const isBuyer = String(txn.buyerId || txn.buyer_id) === String(userData.id);
              const bookName = typeof txn.book === "string" ? txn.book : txn.book?.title || "—";
              const rawDate = txn.createdAt || txn.created_at;
              const formattedDate = rawDate
                ? new Date(rawDate).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "—";

              // Xác định loại giao dịch từ trường type
              const txnType = txn.type || "";
              let label = "";
              let icon = null;
              let iconBg = "";
              let iconColor = "";

              if (txnType === "topup") {
                label = "Nạp tiền";
                icon = (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12l7-7 7 7" /></svg>
                );
                iconBg = "bg-blue-100";
                iconColor = "text-blue-600";
              } else if (txnType === "boost") {
                // Parse plan name from notes: "Mua gói {planName} cho sách: {bookTitle}"
                const planName = txn.notes?.match(/Mua gói (.+?) cho sách/)?.[1] || "";
                label = planName ? `Đẩy tin: ${planName}` : "Dịch vụ đẩy tin";
                icon = (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                );
                iconBg = "bg-violet-100";
                iconColor = "text-violet-600";
              } else if (txnType === "package") {
                // For package type, book field stores the package name directly
                label = bookName ? `Mua gói: ${bookName}` : "Mua gói dịch vụ";
                icon = (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                );
                iconBg = "bg-amber-100";
                iconColor = "text-amber-600";
              } else if (txnType === "buy") {
                if (isBuyer) {
                  label = bookName ? `Mua: ${bookName}` : "Mua sách";
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  );
                  iconBg = "bg-red-100";
                  iconColor = "text-red-500";
                } else {
                  label = bookName ? `Bán: ${bookName}` : "Bán sách";
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  );
                  iconBg = "bg-green-100";
                  iconColor = "text-green-600";
                }
              } else {
                // Fallback cho các type không xác định
                if (isBuyer) {
                  label = "Mua";
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                  );
                  iconBg = "bg-red-100";
                  iconColor = "text-red-500";
                } else {
                  label = "Bán";
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  );
                  iconBg = "bg-green-100";
                  iconColor = "text-green-600";
                }
              }

              // Xác định màu hiển thị số tiền dựa vào type
              let amountColor = "text-red-500";
              let amountPrefix = "-";
              if (txnType === "topup") {
                amountColor = "text-blue-600";
                amountPrefix = "+";
              } else if (txnType === "boost" || txnType === "package") {
                amountColor = "text-red-500";
                amountPrefix = "-";
              } else if (!isBuyer) {
                amountColor = "text-green-600";
                amountPrefix = "+";
              } else if (isBuyer) {
                amountColor = "text-red-500";
                amountPrefix = "-";
              }

              return (
                <div key={txn.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">
                      {label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formattedDate}</p>
                  </div>
                  <span className={`font-bold text-sm ${amountColor}`}>
                    {amountPrefix}{formatPrice(txn.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
