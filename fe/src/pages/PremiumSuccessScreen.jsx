import { useLocation, Link } from "react-router-dom";
import { formatPrice } from "../utils/formatters";

export default function PremiumSuccessScreen() {
  const location = useLocation();
  const state = location.state;

  if (!state || state.type !== "boost") {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-slate-500">Không có thông tin giao dịch.</p>
        <Link to="/" className="vinted-btn-outline mt-4 inline-block">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Kích hoạt dịch vụ thành công!</h1>
        <p className="text-slate-500">Tin đăng của bạn đã được nâng cấp.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6">
        <h2 className="font-bold text-slate-900 text-lg mb-4">Chi tiết giao dịch</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Gói dịch vụ</span>
            <span className="text-sm font-semibold text-slate-900">{state.planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Số tiền</span>
            <span className="text-sm font-bold text-slate-900">{formatPrice(state.amount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Mã tin đăng</span>
            <span className="text-sm font-mono font-semibold text-slate-900">{state.listingId}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to="/giao-dich"
          className="w-full vinted-btn-primary py-3 text-center text-sm font-bold"
        >
          Xem danh sách giao dịch
        </Link>
        <Link
          to="/"
          className="w-full text-center px-6 py-3 font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-lg transition-colors text-sm"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}