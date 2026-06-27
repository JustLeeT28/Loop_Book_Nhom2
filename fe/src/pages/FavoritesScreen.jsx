import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { favoriteApi } from "../services/favoriteApi";
import { listingApi } from "../services/listingApi";
import { formatPrice } from "../utils/formatters";

export default function FavoritesScreen() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookDetails, setBookDetails] = useState({});

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    loadFavorites();
  }, [session]);

  const loadFavorites = async () => {
    try {
      const favs = await favoriteApi.getUserFavorites(session.access_token);
      setFavorites(favs);
      // Load chi tiết từng sách
      const detailPromises = favs.map((fav) =>
        listingApi.getListingById(fav.bookId).catch(() => null)
      );
      const details = await Promise.all(detailPromises);
      const detailMap = {};
      favs.forEach((fav, idx) => {
        if (details[idx]) detailMap[fav.bookId] = details[idx];
      });
      setBookDetails(detailMap);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (bookId) => {
    try {
      await favoriteApi.toggleFavorite(bookId, session.access_token);
      setFavorites((prev) => prev.filter((f) => f.bookId !== bookId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yêu thích</h1>
          <p className="text-sm text-slate-500 mt-1">
            {favorites.length} tài liệu đã lưu
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-2">Chưa có tài liệu yêu thích</p>
          <p className="text-slate-400 text-sm mb-4">
            Nhấn vào trái tim trên mỗi tài liệu để lưu vào danh sách
          </p>
          <Link
            to="/kham-pha"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Khám phá tài liệu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const book = bookDetails[fav.bookId];
            if (!book) {
              return (
                <div key={fav.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">ID: {fav.bookId.substring(0, 10)}...</div>
                    <button
                      onClick={() => handleRemove(fav.bookId)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Không tìm thấy thông tin</p>
                </div>
              );
            }

            return (
              <Link
                key={fav.id}
                to={`/sach/${fav.bookId}`}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                  <img
                    src={book.images?.[0] || "https://placehold.co/400x300?text=No+Image"}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 bg-white/90 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {formatPrice(book.price)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mb-2">
                    {book.author || "Đang cập nhật"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Đã thích</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(fav.bookId);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}