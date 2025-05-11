import axios from 'axios';

const API_URL = 'http://157.230.124.2:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
};

// Auth APIs
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getCurrentUser = () => api.get('/auth/me');

// Cars APIs
export const getCars = async (params = {}) => {
  const queryString = buildQueryString(params);
  const response = await api.get(`/cars${queryString ? `?${queryString}` : ''}`);
  console.log('Cars API response:', response.data);
  return response.data;
};
export const getCar = (id) => api.get(`/cars/${id}`);
export const createCar = (carData) => api.post('/cars', carData);
export const updateCar = (id, carData) => api.put(`/cars/${id}`, carData);
export const deleteCar = (id) => api.delete(`/cars/${id}`);

// Auctions APIs
export const getAuctions = () => api.get('/auctions');
export const getAuction = (id) => api.get(`/auctions/${id}`);
export const createAuction = (auctionData) => api.post('/auctions', auctionData);
export const updateAuction = (id, auctionData) => api.put(`/auctions/${id}`, auctionData);
export const deleteAuction = (id) => api.delete(`/auctions/${id}`);

// Users APIs
export const getUsers = async () => {
  const response = await api.get('/users');
  console.log('Users API response:', response.data);
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export default api;
