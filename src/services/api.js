import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For iOS simulator, use localhost
// For Android emulator, use 10.0.2.2
const API_URL = 'http://139.59.148.94:5001/api';

// Helper function to get headers
const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    await AsyncStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    throw error;
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    await AsyncStorage.setItem('token', data.token);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: await getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('token');
    return { success: true };
  } catch (error) {
    throw error;
  }
};

// Car APIs
export const getAuctions = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/auctions${queryString ? `?${queryString}` : ''}`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    throw error;
  }
};

export const getCars = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/cars?${queryString}`, {
      headers: await getHeaders(),
    });
    const result = await handleResponse(response);
    console.log('Cars API response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching cars:', error);
    throw error;
  }
};

export const getCarById = async (carId) => {
  try {
    const response = await fetch(`${API_URL}/cars/${carId}`, {
      headers: await getHeaders(),
    });
    const result = await handleResponse(response);
    console.log('Car details response:', result);
    return result;
  } catch (error) {
    console.error(`Error fetching car ${carId}:`, error);
    throw error;
  }
};

export const getAuctionById = async (auctionId) => {
  try {
    const response = await fetch(`${API_URL}/auctions/${auctionId}`, {
      headers: await getHeaders(),
    });
    const result = await handleResponse(response);
    console.log('Auction details response:', result);
    return result;
  } catch (error) {
    console.error(`Error fetching auction ${auctionId}:`, error);
    throw error;
  }
};

export const placeBid = async (auctionId, amount) => {
  try {
    const response = await fetch(`${API_URL}/auctions/${auctionId}/bid`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ amount }),
    });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const getMyBids = async () => {
  try {
    const response = await fetch(`${API_URL}/auctions/my-bids`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching my bids:', error);
    throw error;
  }
};

export const getMyAuctions = async () => {
  try {
    const response = await fetch(`${API_URL}/auctions/my-auctions`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching my auctions:', error);
    throw error;
  }
};

export const getLiveAuctions = async () => {
  try {
    const response = await fetch(`${API_URL}/auctions?status=active`, {
      headers: await getHeaders(),
    });
    const result = await handleResponse(response);
    console.log('Live auctions response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching live auctions:', error);
    throw error;
  }
};

export const getUpcomingAuctions = async () => {
  try {
    const response = await fetch(`${API_URL}/auctions?status=upcoming`, {
      headers: await getHeaders(),
    });
    const result = await handleResponse(response);
    console.log('Upcoming auctions response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching upcoming auctions:', error);
    throw error;
  }
};

export const uploadImages = async (images) => {
  try {
    const formData = new FormData();
    
    // Add each image to the form data
    images.forEach((image, index) => {
      const imageFile = {
        uri: image.uri,
        type: 'image/jpeg',
        name: `image-${index}.jpg`
      };
      formData.append('images', imageFile);
    });

    const response = await fetch(`${API_URL}/cars/upload`, {
      method: 'POST',
      headers: await getHeaders(true),
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload images');
    }

    const result = await response.json();
    console.log('Upload response:', result);
    return result;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

// Error handler
const handleResponse = async (response) => {
  try {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    
    // Helper function to safely convert ObjectIds and handle special fields
    const processValue = (value, key) => {
      if (!value) return value;
      
      // Convert ObjectIds to strings
      if (key === '_id' || key.endsWith('Id')) {
        return typeof value === 'object' ? value.toString() : value;
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(item => processObject(item));
      }
      
      // Handle nested objects
      if (typeof value === 'object' && value !== null) {
        return processObject(value);
      }
      
      return value;
    };
    
    // Process an entire object
    const processObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const processed = {};
      Object.entries(obj).forEach(([key, value]) => {
        processed[key] = processValue(value, key);
      });
      
      return processed;
    };
    
    // Process the response data
    let processed;
    if (data.data && Array.isArray(data.data)) {
      processed = {
        ...data,
        data: data.data.map(item => processObject(item))
      };
    } else {
      processed = processObject(data);
    }
    
    console.log('Processed API response:', processed);
    return processed;
  } catch (error) {
    console.error('API Response Error:', error);
    throw new Error(error.message || 'Failed to parse server response');
  }
};
