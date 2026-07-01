import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { walletApi } from "../../services/walletApi";
import {
  createPayOSDepositLink,
  depositWallet,
  checkPayOSPaymentStatus,
} from "../../services/payment";
import { formatPrice } from "../../utils/formatters";

const SUGGESTED_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const PAYMENT_METHODS = [
  {
    id: "payos",
    label: "PayOS (VietQR)",
    desc: "Quét mã QR bằng ứng dụng ngân hàng",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    id: "wallet_api",
    label: "Nạp qua tài khoản ngân hàng",
    desc: "Chuyển khoản thủ công, admin sẽ xác nhận",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: "direct",
    label: "Nạp trực tiếp (Test)",
    desc: "Cộng tiền ngay lập tức vào ví (môi trường phát triển)",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export default function TopUpModal({ isOpen, onClose, onSuccess }) {
  const { userData, token } = useAuth();
  const [amount, setAmount] = useState(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("payos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // form | processing | success

  if (!isOpen) return null;

  const getFinalAmount = () => {
    if (useCustomAmount) {
      return parseInt(customAmount.replace(/\D/g, ""), 10) || 0;
    }
    return amount;
  };

  const handleAmountSelect = (value) => {
    setAmount(value);
    setUseCustomAmount(false);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmount(raw);
    if (raw) {
      setUseCustomAmount(true);
    }
  };

  const handleSubmit = async () => {
    const finalAmount = getFinalAmount();
    if (finalAmount < 10000) {
      setError("Số tiền nạp tối thiểu là 10,000đ");
      return;
    }
    if (finalAmount > 100000000) {
      setError("Số tiền nạp tối đa là 100,000,000đ");
      return;
    }

    setError("");
    setLoading(true);
    setStep("processing");

    try {
      if (paymentMethod === "payos") {
        // Nạp qua PayOS
        const result = await createPayOSDepositLink(userData.id, finalAmount);

        if (result.checkoutUrl) {
          // Lưu orderCode vào localStorage để kiểm tra sau khi quay lại
          localStorage.setItem(
            "pending_topup",
            JSON.stringify({
              orderCode: result.orderCode,
              amount: finalAmount,
              txnId: result.txnId,
              timestamp: Date.now(),
            })
          );

          // Chuyển hướng sang PayOS
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error("Không nhận được đường dẫn thanh toán");
        }
      } else if (paymentMethod === "direct") {
        // Nạp trực tiếp (test) - dùng depositWallet từ payment.js
        await depositWallet(userData.id, finalAmount);

        // Tạo transaction record qua backend để đồng bộ
        try {
          await walletApi.topUp(finalAmount, token);
        } catch (e) {
          console.warn("Topup API warning (direct):", e.message);
        }

        setStep("success");
        setTimeout(() => {
          onSuccess?.(finalAmount);
          onClose();
        }, 2000);
      } else if (paymentMethod === "wallet_api") {
        // Tạo request nạp tiền qua backend (chờ admin duyệt)
        await walletApi.topUp(finalAmount, token);

        setStep("success");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Topup error:", err);
      setError(err.message || "Nạp tiền thất bại, vui lòng thử lại");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = getFinalAmount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Nạp tiền vào ví</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {step === "form" && (
          <div className="px-6 py-5 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Chọn số tiền
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SUGGESTED_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountSelect(amt)}
                    className={`px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      !useCustomAmount && amount === amt
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {formatPrice(amt)}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">
                  Hoặc nhập số tiền khác
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="Nhập số tiền..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-teal-500 focus:ring-0 outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                    đ
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Phương thức thanh toán
              </label>
              <div className="space-y-2.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === method.id
                        ? "border-teal-600 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === method.id
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-semibold text-sm ${
                          paymentMethod === method.id ? "text-teal-700" : "text-slate-800"
                        }`}
                      >
                        {method.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{method.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id
                          ? "border-teal-600 bg-teal-600"
                          : "border-slate-300"
                      }`}
                    >
                      {paymentMethod === method.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Số tiền nạp</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatPrice(finalAmount)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || finalAmount < 10000}
              className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Đang xử lý...
                </>
              ) : (
                `Nạp ${formatPrice(finalAmount)}`
              )}
            </button>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700 mx-auto mb-4" />
            <p className="font-semibold text-slate-800 mb-1">Đang xử lý yêu cầu nạp tiền</p>
            <p className="text-sm text-slate-400">Vui lòng chờ trong giây lát...</p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-lg text-slate-900 mb-1">Yêu cầu nạp tiền thành công!</p>
            <p className="text-sm text-slate-400">
              {paymentMethod === "wallet_api"
                ? "Vui lòng chờ admin xác nhận. Số dư sẽ được cập nhật sau khi duyệt."
                : "Số dư đã được cập nhật vào ví của bạn."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}