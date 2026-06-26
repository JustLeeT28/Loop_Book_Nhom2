import { useState, useEffect } from "react";
import { listingApi } from "../services/listingApi";

/**
 * Custom hook fetch sách từ Backend API với filter/sort.
 * @param {object} options - { category, school, priceMin, priceMax, sortBy, limit, status }
 */
export function useBooks(options = {}) {
  const { category, school, priceMin, priceMax, sortBy, limit, status = 'active' } = options;

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBooks = async () => {
      setLoading(true);
      try {
        // Gọi API backend để lấy listings
        const params = {
          page: 0,
          size: limit || 20,
          status: status,
        };

        // Thêm filters nếu có
        if (category && category !== "all") {
          params.category = category;
        }
        if (school && school !== "all") {
          params.school = school;
        }
        if (priceMin != null && priceMin > 0) {
          params.minPrice = priceMin;
        }
        if (priceMax != null && priceMax !== Infinity) {
          params.maxPrice = priceMax;
        }
        
        // Sort: giá trị khớp với switch case bên BookController
        if (sortBy === "price_asc") {
          params.sort = "price_asc";
        } else if (sortBy === "price_desc") {
          params.sort = "price_desc";
        } else if (sortBy === "newest") {
          params.sort = "newest";
        } else if (sortBy === "oldest") {
          params.sort = "oldest";
        } else if (sortBy === "title_asc") {
          params.sort = "title_asc";
        } else if (sortBy === "title_desc") {
          params.sort = "title_desc";
        } else {
          // Mặc định: mới nhất
          params.sort = "newest";
        }

        const response = await listingApi.getListings(params);
        const data = response.content || [];

        // Chuẩn hóa format để BookCard dùng được
        const normalized = data.map((b) => ({
          id: b.id,
          title: b.title,
          condition: b.condition,
          price: b.price,
          originalPrice: b.originalPrice,
          images: b.images || [],
          image: Array.isArray(b.images) && b.images.length > 0 ? b.images[0] : null,
          urgent: b.urgent,
          verified: false, // Backend chưa có field này
          school: b.school,
          category: b.category,
          created_at: b.createdAt,
          createdAt: b.createdAt,
          seller_id: b.sellerId,
          seller: b.seller || {
            name: "Người bán",
            rating: "0.0",
          },
          description: b.description,
          author: b.author,
          publisher: b.publisher,
          edition: b.edition,
          year: b.year,
          allowOffers: b.allowOffers,
          deliveryMethods: b.deliveryMethods,
          tags: b.tags,
          locationText: b.locationText,
          status: b.status,
          viewCount: b.viewCount,
          favoriteCount: b.favoriteCount,
          isSold: b.isSold,
        }));

        if (!cancelled) setBooks(normalized);
      } catch (err) {
        console.error("useBooks error:", err);
        if (!cancelled) setError(err.message || "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBooks();
    return () => { cancelled = true; };
  }, [category, school, priceMin, priceMax, sortBy, limit, status]);

  return { books, loading, error };
}
