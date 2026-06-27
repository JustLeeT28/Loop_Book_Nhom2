import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { listingApi } from "../services/listingApi";
import { configApi } from "../services/configApi";
import BookCard from "../components/common/BookCard";

const PRICE_PRESETS = [
  { label: "Tất cả", min: 0, max: Infinity },
  { label: "Dưới 50k", min: 0, max: 50000 },
  { label: "50k – 100k", min: 50000, max: 100000 },
  { label: "100k – 200k", min: 100000, max: 200000 },
  { label: "Trên 200k", min: 200000, max: Infinity },
];

export default function ExploreScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [sortBy, setSortBy] = useState("relevant");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [keyword, setKeyword] = useState(urlQuery);

  // Data từ BE
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [catData, bookData] = await Promise.all([
          configApi.getCategories(),
          listingApi.getListings({ size: 100 }),
        ]);
        if (cancelled) return;

        // Xử lý categories (đảm bảo catData là array)
        const catList = Array.isArray(catData)
          ? catData.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon || "📚",
              slug: c.slug,
            }))
          : [];
        setCategories(catList);

        // Extract danh sách trường từ books (đảm bảo bookData.content hoặc bookData là array)
        const bookList = Array.isArray(bookData)
          ? bookData
          : Array.isArray(bookData?.content)
          ? bookData.content
          : [];
        const activeBooks = bookList.filter((b) => b.status === "active");
        setBooks(activeBooks);
        const schoolSet = new Set(activeBooks.map((b) => b.school).filter(Boolean));
        const schools = [...schoolSet].sort((a, b) =>
          (a || "").localeCompare(b || "", "vi")
        );
        setAllSchools(schools);
      } catch (err) {
        console.error("Failed to load explore data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Đồng bộ keyword từ URL khi URL thay đổi (người dùng search từ TopNav)
  useEffect(() => {
    setKeyword(urlQuery);
  }, [urlQuery]);

  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Lọc từ khóa (tìm trong title, author, description)
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      result = result.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(kw)) ||
          (b.author && b.author.toLowerCase().includes(kw)) ||
          (b.description && b.description.toLowerCase().includes(kw))
      );
    }

    // Lọc danh mục
    if (selectedCategory !== "all") {
      result = result.filter((b) => b.category === selectedCategory);
    }

    // Lọc trường
    if (selectedSchool !== "all") {
      result = result.filter((b) => b.school === selectedSchool);
    }

    // Lọc giá
    const { min, max } = PRICE_PRESETS[selectedPrice];
    result = result.filter((b) => b.price >= min && b.price <= max);

    // Sắp xếp: boosted-first
    const now = new Date().toISOString();
    result.sort((a, b) => {
      // Listing đang được boost (boostExpiry > now) luôn lên đầu
      const aBoosted = a.boostExpiry && a.boostExpiry > now ? 1 : 0;
      const bBoosted = b.boostExpiry && b.boostExpiry > now ? 1 : 0;
      if (aBoosted !== bBoosted) return bBoosted - aBoosted;
      
      // Sau đó mới áp dụng sort theo lựa chọn của user
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") return (b.year || 0) - (a.year || 0);
      return 0;
    });

    return result;
  }, [books, keyword, selectedCategory, selectedSchool, selectedPrice, sortBy]);

  const hasFilter =
    keyword !== "" || selectedCategory !== "all" || selectedSchool !== "all" || selectedPrice !== 0;

  const resetAll = () => {
    setKeyword("");
    setSearchParams({});
    setSelectedCategory("all");
    setSelectedSchool("all");
    setSelectedPrice(0);
    setSchoolQuery("");
  };

  const filteredSchools = allSchools.filter((s) =>
    (s || "").toLowerCase().includes(schoolQuery.toLowerCase())
  );

  // Map BE book → format BookCard mong đợi
  const mapBookForCard = (book) => ({
    ...book,
    image: book.images?.[0] || "https://placehold.co/300x400?text=No+Image",
    verified: false,
    seller: { name: book.sellerName || "Người bán" },
  });

  // Loading state
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
    <div className="py-6 flex flex-col lg:flex-row gap-8">
      {/* ── Sidebar Bộ lọc ── */}
      <aside className="w-full lg:w-72 flex-shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Bộ lọc</h2>
            {hasFilter && (
              <button
                onClick={resetAll}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium hover:underline transition-colors"
              >
                Xoá tất cả
              </button>
            )}
          </div>

          {/* 1. Danh mục */}
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Danh mục ngành
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === "all"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  Tất cả danh mục
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat.id ? "all" : cat.id
                      )
                    }
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between group border ${
                      selectedCategory === cat.id
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : "text-slate-600 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon || "📚"}</span>
                      {cat.name}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        selectedCategory === cat.id
                          ? "text-teal-600"
                          : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    >
                      {books.filter((b) => b.category === cat.id).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-100" />

          {/* 2. Trường đại học */}
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Trường đại học
            </h3>
            <div className="relative mb-3">
              <svg
                className="absolute left-3 top-3 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm trường..."
                value={schoolQuery}
                onChange={(e) => setSchoolQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 bg-white transition-colors"
              />
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              <button
                onClick={() => setSelectedSchool("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  selectedSchool === "all"
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "text-slate-600 hover:bg-slate-50 border-transparent"
                }`}
              >
                Tất cả trường
              </button>
              {filteredSchools.map((school) => (
                <button
                  key={school}
                  onClick={() =>
                    setSelectedSchool(
                      selectedSchool === school ? "all" : school
                    )
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all leading-snug border ${
                    selectedSchool === school
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "text-slate-600 hover:bg-slate-50 border-transparent"
                  }`}
                >
                  {school}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* 3. Khoảng giá */}
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Khoảng giá
            </h3>
            <ul className="space-y-2">
              {PRICE_PRESETS.map((preset, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => setSelectedPrice(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      selectedPrice === idx
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : "text-slate-600 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0">
        {/* Active filter chips */}
        {hasFilter && (
          <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-slate-100">
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-200 hover:bg-teal-100 transition-colors">
                <span>
                  {categories.find((c) => c.id === selectedCategory)?.icon ||
                    "📚"}
                </span>
                {categories.find((c) => c.id === selectedCategory)?.name ||
                  selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-0.5 hover:text-teal-900"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedSchool !== "all" && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-200 hover:bg-teal-100 transition-colors">
                🏫 {selectedSchool}
                <button
                  onClick={() => setSelectedSchool("all")}
                  className="ml-0.5 hover:text-teal-900"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedPrice !== 0 && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-200 hover:bg-teal-100 transition-colors">
                💰 {PRICE_PRESETS[selectedPrice].label}
                <button
                  onClick={() => setSelectedPrice(0)}
                  className="ml-0.5 hover:text-teal-900"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-lg font-bold text-slate-900">
            {filteredBooks.length} tài liệu
            {selectedCategory !== "all" && (
              <span className="font-normal text-slate-500 text-base">
                {" "}
                ·{" "}
                {categories.find((c) => c.id === selectedCategory)?.name ||
                  selectedCategory}
              </span>
            )}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 rounded-lg bg-white px-3 py-2 font-medium text-slate-700 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 text-sm cursor-pointer transition-colors hover:border-slate-300"
            >
              <option value="relevant">Phù hợp nhất</option>
              <option value="price_asc">Giá thấp → cao</option>
              <option value="price_desc">Giá cao → thấp</option>
              <option value="newest">Mới nhất</option>
            </select>
          </div>
        </div>

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={mapBookForCard(book)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <svg
              className="w-12 h-12 mb-4 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="font-semibold text-slate-500">
              Không tìm thấy tài liệu nào
            </p>
            <p className="text-sm mt-1">
              Thử điều chỉnh bộ lọc để xem thêm kết quả
            </p>
            <button
              onClick={resetAll}
              className="mt-4 px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-lg hover:bg-teal-800 transition-colors"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </main>
    </div>
  );
}