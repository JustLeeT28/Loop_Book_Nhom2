const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const listingApi = {
  // Create a new listing
  async createListing(listingData, authToken) {
    const response = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(listingData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create listing');
    }

    return await response.json();
  },

  // Update an existing listing
  async updateListing(bookId, updateData, authToken) {
    const response = await fetch(`${API_URL}/listings/${bookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update listing');
    }

    return await response.json();
  },

  // Delete a listing
  async deleteListing(bookId, authToken) {
    const response = await fetch(`${API_URL}/listings/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete listing');
    }

    return null;
  },

  // Get listing by ID
  async getListingById(bookId) {
    const response = await fetch(`${API_URL}/listings/${bookId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch listing');
    }

    return await response.json();
  },

  // Get all listings (public) with filters
  async getListings(params = {}) {
    const { page = 0, size = 10, status, category, school, minPrice, maxPrice, sort } = params;
    
    // Build query string
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (status) queryParams.append('status', status);
    if (category) queryParams.append('category', category);
    if (school) queryParams.append('school', school);
    if (minPrice != null) queryParams.append('minPrice', minPrice.toString());
    if (maxPrice != null) queryParams.append('maxPrice', maxPrice.toString());
    if (sort) queryParams.append('sort', sort);

    const response = await fetch(
      `${API_URL}/listings?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch listings');
    }

    return await response.json();
  },

  // Get user's listings
  async getUserListings(authToken, page = 0, size = 10) {
    const response = await fetch(
      `${API_URL}/listings/user/my-listings?page=${page}&size=${size}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user listings');
    }

    return await response.json();
  },

  // Get listings by status (admin)
  async getListingsByStatus(status, page = 0, size = 10) {
    const response = await fetch(
      `${API_URL}/listings/status/${status}?page=${page}&size=${size}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch listings');
    }

    return await response.json();
  },

  // Update listing status (admin)
  async updateListingStatus(bookId, status, authToken) {
    const response = await fetch(
      `${API_URL}/listings/${bookId}/status/${status}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update listing status');
    }

    return await response.json();
  },

  // Reject listing (admin)
  async rejectListing(bookId, reason, authToken) {
    const response = await fetch(
      `${API_URL}/listings/${bookId}/reject?reason=${encodeURIComponent(reason)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject listing');
    }

    return await response.json();
  },
};