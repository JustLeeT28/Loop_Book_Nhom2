const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const configApi = {
  /**
   * Lấy danh sách danh mục từ backend
   * @returns {Promise<Array<{id: string, name: string, accent: string, booksCount: number}>>}
   */
  async getCategories() {
    const response = await fetch(`${API_URL}/config/categories`);
    if (!response.ok) {
      throw new Error('Không thể tải danh mục');
    }
    return response.json();
  },

  /**
   * Lấy danh sách trường gợi ý
   */
  async getSchools() {
    const response = await fetch(`${API_URL}/config/schools`);
    if (!response.ok) {
      throw new Error('Không thể tải danh sách trường');
    }
    return response.json();
  },

  /**
   * Lấy option tình trạng sách
   */
  async getConditions() {
    const response = await fetch(`${API_URL}/config/conditions`);
    if (!response.ok) {
      throw new Error('Không thể tải tình trạng sách');
    }
    return response.json();
  },

  /**
   * Lấy option phương thức giao hàng
   */
  async getDeliveryMethods() {
    const response = await fetch(`${API_URL}/config/delivery-methods`);
    if (!response.ok) {
      throw new Error('Không thể tải phương thức giao hàng');
    }
    return response.json();
  },
};