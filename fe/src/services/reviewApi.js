const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const reviewApi = {
  async createReview(reviewData, authToken) {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review');
    }
    return await response.json();
  },

  async getReviewsByBook(bookId) {
    const response = await fetch(`${API_URL}/reviews/book/${bookId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reviews');
    }
    return await response.json();
  },

  async getBookReviewStats(bookId) {
    const response = await fetch(`${API_URL}/reviews/book/${bookId}/stats`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch review stats');
    }
    return await response.json();
  },

  // Lấy danh sách review dành cho 1 user (người bán được đánh giá)
  async getUserReviews(userId) {
    const response = await fetch(`${API_URL}/reviews/user/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user reviews');
    }
    return await response.json();
  },

  // Lấy thống kê đánh giá của 1 user (người bán)
  async getUserReviewStats(userId) {
    const response = await fetch(`${API_URL}/reviews/user/${userId}/stats`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user review stats');
    }
    return await response.json();
  },

  // Lấy danh sách review mà mình đã viết
  async getMyReviews(authToken) {
    const response = await fetch(`${API_URL}/reviews/my`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch my reviews');
    }
    return await response.json();
  },
};