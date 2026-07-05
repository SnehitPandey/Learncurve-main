/**
 * User Context
 * Provides centralized user state management across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { getUserAvatarUrl } from '../utils/imageUtils';
import { initializeThemeSettings, initializeAccentColor } from '../utils/themeUtils';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize theme on mount (theme is not user-specific)
  useEffect(() => {
    initializeThemeSettings();
  }, []);

  // Load user data on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = authService.getUser();
        const authenticated = authService.isAuthenticated();

        if (authenticated && storedUser) {
          // User data is stored as-is, avatar URL will be computed via getUserAvatarUrl()
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Setup socket connection based on user authentication
  useEffect(() => {
    import('../services/socketService').then(({ socketService }) => {
      if (isAuthenticated && user) {
        if (!socketService.isConnected()) {
          console.log('Connecting socket from UserContext...');
          socketService.connect();
        }
      } else {
        if (socketService.isConnected()) {
          console.log('Disconnecting socket from UserContext...');
          socketService.disconnect();
        }
      }
    });
  }, [isAuthenticated, user]);

  // Reinitialize accent color when user changes (load user-specific accent color)
  useEffect(() => {
    if (user) {
      // User is logged in, load their accent color preference
      initializeAccentColor();
    }
  }, [user]);

  // Update user data
  const updateUser = (newUserData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Set complete user data (e.g., after login)
  const setUserData = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Clear user data (e.g., on logout)
  const clearUser = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // Refresh user data from API
  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUserData(response.data);
        return response.data;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      clearUser();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    updateUser,
    setUserData,
    clearUser,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
