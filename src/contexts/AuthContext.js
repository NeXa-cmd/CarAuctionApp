import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        return;
      }

      const userData = await api.getProfile();
      console.log('Profile data from API:', userData);
      
      if (userData && userData.data) {
        setUser(userData.data);
      } else {
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth loading error:', err.message);
      setError('Unable to connect to the server. Please check your connection and try again.');
      await AsyncStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await api.login(email, password);
      console.log('Login response:', userData);
      
      if (userData && userData.data) {
        setUser(userData.data);
      } else {
        setUser(userData);
      }
      return userData;
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message || 'Invalid credentials. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { token, user } = response.data;
      
      // Store the token
      await AsyncStorage.setItem('token', token);
      
      // Set the auth state
      setUser(user);
      setToken(token);
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      setLoading(true);
      const updatedUser = await api.updateProfile(data);
      if (updatedUser && updatedUser.data) {
        setUser(updatedUser.data);
      } else {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.logout();
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        loadUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};