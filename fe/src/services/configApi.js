const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const configApi = {
  // Lấy danh sách tình trạng sách
  async getConditionOptions() {
    const response = await fetch(`${API_URL}/config/conditions`);
    if (!response.ok) {
      throw new Error('Failed to fetch condition options');
    }
    return await response.json();
  },

  // Lấy danh sách phương thức giao dịch
  async getDeliveryOptions() {
    const response = await fetch(`${API_URL}/config/delivery-methods`);
    if (!response.ok) {
      throw new Error('Failed to fetch delivery options');
    }
    return await response.json();
  },

  // Lấy danh sách gợi ý trường đại học
  async getSchoolSuggestions() {
    const response = await fetch(`${API_URL}/config/schools`);
    if (!response.ok) {
      throw new Error('Failed to fetch school suggestions');
    }
    return await response.json();
  },

  // Lấy danh sách danh mục
  async getCategories() {
    const response = await fetch(`${API_URL}/config/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return await response.json();
  },
};
