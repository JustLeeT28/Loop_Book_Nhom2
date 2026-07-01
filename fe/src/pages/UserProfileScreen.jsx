import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userApi } from "../services/userApi";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../services/supabase";

export default function UserProfileScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerBooks, setSellerBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Fetch user profile
  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await userApi.getUserProfile(userId);
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError(err.message || "Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch sách của người dùng này (nếu họ là người bán)
  useEffect(() => {
    if (!userId) return;

    const fetchSellerBooks = async () => {
      setLoadingBooks(true);
      try {
        const { data, error } = await supabase
          .from("lb_books")
          .select("id, title, image, price, status, created_at")
          .eq("seller_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12);

        if (!error && data) {
          setSellerBooks(data);
        }
      } catch (err) {
        console.warn("Failed to fetch seller books:", err);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchSellerBooks();
  }, [userId]);

  // Format join date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Render star rating
  const renderRating = (rating) => {
    if (!rating || rating === 0) return "Chưa có đánh giá";
    const stars = Math.round(Number(rating));
    return "★".repeat(stars) + "☆".repeat(5 - stars) + ` ${Number(rating).toFixed(1)}`;
  };

  // Check if this is the current user's own profile
  const isOwnProfile = userData?.id === userId;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-teal-700 font-medium hover:underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-500">Không tìm thấy người dùng</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-teal-700 font-medium hover:underline"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-teal-700 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Quay lại</span>
      </button>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Banner / Header */}
        <div className="h-32 bg-gradient-to-r from-teal-500 to-teal-700"></div>

        <div className="px-6 pb-6">
          {/* Avatar + Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-3xl shadow-md shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.name || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-center sm:text-left flex-1 mt-2 sm:mt-0">
              <h1 className="text-2xl font-bold text-slate-900">{profile.name || "Người dùng"}</h1>
              <p className="text-sm text-slate-500">
                Thành viên từ {formatDate(profile.joinDate)}
              </p>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => navigate("/profile")}
                className="px-4 py-2 text-sm font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Chỉnh sửa trang cá nhân
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{profile.listingsCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Tin đăng</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{profile.salesCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Đã bán</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{renderRating(profile.rating)}</p>
              <p className="text-xs text-slate-500 mt-1">Đánh giá</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {profile.responseTime != null ? `${profile.responseTime}h` : "—"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Phản hồi</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 text-sm mb-2">Giới thiệu</h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Thông tin liên hệ</h3>
            <div className="space-y-2 text-sm">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-700">{profile.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-slate-700">{profile.phone}</span>
                </div>
              )}
              {profile.address && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-slate-700">{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách sách đang bán */}
      {sellerBooks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Sách đang bán ({sellerBooks.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sellerBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/sach/${book.id}`)}
                className="border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-white"
              >
                <div className="aspect-[3/4] bg-slate-100 overflow-hidden">
                  {book.image ? (
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-slate-900 truncate">{book.title}</p>
                  {book.price != null && (
                    <p className="text-sm font-bold text-teal-700 mt-1">
                      {Number(book.price).toLocaleString()}đ
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}