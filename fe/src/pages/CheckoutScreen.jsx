import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatPrice } from "../utils/formatters";
import { transactionApi } from "../services/transactionApi";
import { walletApi } from "../services/walletApi";
import { listingApi } from "../services/listingApi";

const paymentMethods = [
  { id: "wallet", label: "Ví LoopBook", description: "Thanh toán bằng số dư trong ví" },
  { id: "cash", label: "Tiền mặt", description: "Thanh toán khi gặp mặt trực tiếp" },
  { id: "bank_transfer", label: "Chuyển khoản", description: "Chuyển khoản ngân hàng" },
];

export default function CheckoutScreen() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { userData, token, showToast } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy chi tiết sách qua BE (không cần token, public API)
        console.log("Fetching book:", bookId);
        const bookData = await listingApi.getListingById(bookId);
        console.log("Book data:", bookData);
        setBook(bookData);

        // Lấy ví người dùng qua BE (cần token, fail gracefully nếu chưa có ví)
        if (token) {
          try {
            const walletData = await walletApi.getWallet(token);
            setWallet(walletData);
          } catch (walletErr) {
            console.warn("Wallet fetch failed (user may not have wallet yet):", walletErr.message);
            // User chưa có ví - vẫn cho phép checkout, chỉ không có thông tin số dư
            setWallet({ balance: 0 });
          }
        } else {
          console.warn("CheckoutScreen: No token available, wallet info skipped");
          setWallet({ balance: 0 });
        }
      } catch (err) {
        console.error("CheckoutScreen fetch error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookId, token]);

  const handleSubmit = async () => {
    if (!userData || !token) {
      showToast("Vui lòng đăng nhập để thanh toán.", "error");
      return;
    }
    if (!book) {
      showToast("Không tìm thấy thông tin sách.", "error");
      return;
    }
    setSubmitting(true);
    try {
      console.log("Creating transaction...", { bookId, amount: book.price, paymentMethod });
      const txn = await transactionApi.createTransaction(
        {
          bookId,
          amount: book.price,
          type: "buy",
          paymentMethod,
        },
        token
      );
      console.log("Transaction created:", txn);

      navigate(`/transaction/${txn.id}/success`);
      showToast("Đặt mua thành công!", "success");
    } catch (err) {
      console.error("Transaction creation failed:", err.message);
      showToast(err.message || "Có lỗi xảy ra.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không thể tải trang thanh toán</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">{error || "Không tìm thấy thông tin sách. Vui lòng kiểm tra lại đường dẫn hoặc quay lại sau."}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-lg transition-colors text-sm">Quay lại</button>
          <button onClick={() => navigate("/")} className="px-6 py-2.5 vinted-btn-primary text-sm">Về trang chủ</button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-slate-600 mb-6">Vui lòng đăng nhập để tiếp tục thanh toán.</p>
        <button onClick={() => navigate("/")} className="vinted-btn-outline w-auto px-8 mx-auto">Về trang chủ</button>
      </div>
    );
  }

  const sufficientFunds = wallet && wallet.balance >= book.price;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Thanh toán</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Thông tin sách</h2>
        <div className="flex items-start gap-4">
          {book.images?.[0] && (
            <img src={book.images[0]} alt={book.title} className="w-20 h-28 object-cover rounded-md" />
          )}
          <div>
            <p className="font-semibold text-slate-900">{book.title}</p>
            <p className="text-sm text-slate-500 mt-1">Người bán: {book.sellerName || "—"}</p>
            <p className="text-lg font-bold text-teal-700 mt-2">{formatPrice(book.price)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Phương thức thanh toán</h2>
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <label
              key={pm.id}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                paymentMethod === pm.id
                  ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={pm.id}
                checked={paymentMethod === pm.id}
                onChange={() => setPaymentMethod(pm.id)}
                className="accent-teal-700"
              />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{pm.label}</p>
                <p className="text-xs text-slate-500">{pm.description}</p>
              </div>
            </label>
          ))}
        </div>

        {paymentMethod === "wallet" && wallet && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Số dư ví:</span>
              <span className="font-bold text-slate-900">{formatPrice(wallet.balance)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-600">Giá sách:</span>
              <span className="font-bold text-slate-900">{formatPrice(book.price)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Kết quả:</span>
              <span className={`font-bold ${sufficientFunds ? "text-green-600" : "text-red-500"}`}>
                {sufficientFunds ? "Đủ tiền" : "Không đủ tiền"}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || (paymentMethod === "wallet" && !sufficientFunds)}
        className="w-full vinted-btn-primary py-3 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Đang xử lý...
          </>
        ) : (
          "Xác nhận thanh toán"
        )}
      </button>
    </div>
  );
}