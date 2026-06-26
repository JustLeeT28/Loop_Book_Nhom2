const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const userApi = {
  // Lấy profile của chính mình
  async getMyProfile(authToken) {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }
    return await response.json();
  },

  // Cập nhật profile của mình
  async updateProfile(profileData, authToken) {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    return await response.json();
  },

  // Xem profile người khác (public)
  async getUserProfile(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user profile');
    }
    return await response.json();
  },
};