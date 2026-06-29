import axios from 'axios';

const API_URL = 'http://localhost:8080/api/listings';

const getListings = async (page = 0, size = 8, status = null, searchTerm = '', sortConfig = { key: 'createdAt', direction: 'desc' }) => {
  try {
    const params = {
      page,
      size,
      sort: `${sortConfig.key}_${sortConfig.direction}`,
    };

    if (status) {
      params.status = status;
    }
    if (searchTerm) {
      params.searchTerm = searchTerm;
    }

    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    throw error;
  }
};

const updateListingStatus = async (bookId, status, token) => {
  try {
    const response = await axios.put(`${API_URL}/${bookId}/status/${status}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw error;
  }
};

const rejectListing = async (bookId, reason, token) => {
  try {
    const response = await axios.post(`${API_URL}/${bookId}/reject`, null, {
      params: { reason },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting listing:', error);
    throw error;
  }
};

export {
  getListings,
  updateListingStatus,
  rejectListing,
};