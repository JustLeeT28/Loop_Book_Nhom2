const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const favoriteApi = {
  // Toggle favorite (add/remove)
  async toggleFavorite(bookId, authToken) {
    const response = await fetch(`${API_URL}/favorites/toggle/${bookId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle favorite');
    }

    return await response.json();
  },

  // Check if book is favorited
  async checkFavorited(bookId, authToken) {
    const response = await fetch(`${API_URL}/favorites/check/${bookId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check favorite');
    }

    return await response.json();
  },

  // Get user's favorites
  async getUserFavorites(authToken) {
    const response = await fetch(`${API_URL}/favorites`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch favorites');
    }

    return await response.json();
  },

  // Get favorite count for a book
  async getFavoriteCount(bookId) {
    const response = await fetch(`${API_URL}/favorites/count/${bookId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch favorite count');
    }

    return await response.json();
  },
};