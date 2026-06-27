import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/formatters";

export default function BookCard({ book }) {
  return (
    <Link to={`/sach/${book.id}`} className="group block">
      {/* Ảnh */}
      <div className="relative aspect-[3/4] mb-3 bg-slate-100 overflow-hidden rounded-lg">
        {book.images?.[0] ? (
        <img
          src={book.images[0]}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs">Chưa có ảnh</span>
        </div>
        )}
        {/* Badge đẩy tin */}
        {(() => {
          const now = new Date().toISOString();
          const isBoosted = book.boostExpiry && book.boostExpiry > now;
          if (!isBoosted) return null;
          return (
            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <span>🔥</span>
              <span>Đẩy tin</span>
            </div>
          );
        })()}
        {/* Badge bán gấp */}
        {book.urgent && (
          <div className="absolute top-10 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Bán gấp
          </div>
        )}
        {/* Badge xác thực */}
        {false && (
          <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1" title="Đã kiểm định">
            <svg className="w-3.5 h-3.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {/* Người bán (avatar mini) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
          <div className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
            {book.seller?.name?.charAt(0) || "N"}
          </div>
          <span className="text-[11px] text-slate-700 font-medium truncate max-w-[70px]">
            {book.seller?.name?.split(" ").pop() || "Người bán"}
          </span>
        </div>
      </div>

      {/* Thông tin bên dưới */}
      <div>
        <p className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1 group-hover:text-teal-700 transition-colors">
          {book.title}
        </p>
        <p className="text-[12px] text-slate-400 mb-1.5 truncate">{book.condition} · {book.school}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-slate-900">{formatPrice(book.price)}</span>
          {book.originalPrice != null && book.originalPrice > 0 && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(book.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
