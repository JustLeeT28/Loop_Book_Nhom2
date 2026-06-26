const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const walletApi = {
  async getWallet(authToken) {
    const response = await fetch(`${API_URL}/wallet`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch wallet');
    }
    return await response.json();
  },

  async topUp(amount, authToken) {
    const response = await fetch(`${API_URL}/wallet/topup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to top up wallet');
    }
    return await response.json();
  },
};