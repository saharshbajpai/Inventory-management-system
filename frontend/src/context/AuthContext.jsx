import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // Initialize auth state from local/session storage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (e) {
          console.error("Failed to parse stored user", e);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [logout]);

  // Login function
  const login = async (email, password, rememberMe) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedUser } = res.data;

      setToken(access_token);
      setUser(loggedUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', access_token);
      storage.setItem('user', JSON.stringify(loggedUser));

      showToast('Logged in successfully.', 'success');
      return loggedUser;
    } catch (err) {
      const detail = err.detail || 'Incorrect email or password.';
      showToast(detail, 'error');
      throw err;
    }
  };

  // Signup function
  const signup = async (fullName, email, password, role) => {
    try {
      await api.post('/auth/signup', {
        full_name: fullName,
        email,
        password,
        role
      });
      showToast('Account registered successfully! Please login.', 'success');
    } catch (err) {
      const detail = err.detail || 'Failed to register account.';
      showToast(detail, 'error');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
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

export default AuthContext;
