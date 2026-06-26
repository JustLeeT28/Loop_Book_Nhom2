const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const transactionApi = {
  async getTransactions(authToken) {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      let message = 'Failed to fetch transactions';
      try { const error = await response.json(); message = error.error || message; } catch (_) {}
      throw new Error(message);
    }
    return await response.json();
  },

  async getTransactionById(id, authToken) {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      let message = 'Failed to fetch transaction';
      try { const error = await response.json(); message = error.error || message; } catch (_) {}
      throw new Error(message);
    }
    return await response.json();
  },

  async createTransaction(transactionData, authToken) {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) {
      let message = 'Failed to create transaction';
      try { const error = await response.json(); message = error.error || message; } catch (_) {}
      throw new Error(message);
    }
    return await response.json();
  },
};