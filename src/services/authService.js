/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

export const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  async login(email, password) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      if (data.success) {
        if (data.user) {
          apiClient.setUser(data.user);
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register new user account
   * @param {string} name - User full name
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and tokens
   */
  async register(name, email, password) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name,
        email,
        password,
      });

      if (data.success) {
        if (data.user) {
          apiClient.setUser(data.user);
        }
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearUserData();
    }
  },

  /**
   * Refresh access token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken() {
    return apiClient.refreshToken();
  },

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      if (response.success && response.data) {
        apiClient.setUser(response.data);
      }
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return apiClient.isAuthenticated();
  },

  /**
   * Get stored user data
   * @returns {Object|null} User data or null
   */
  getUser() {
    return apiClient.getUser();
  },

  /**
   * Send OTP for login or signup
   * @param {string} email - User email
   * @param {'LOGIN'|'SIGNUP'} purpose - Purpose of OTP
   * @returns {Promise<Object>} Response with success message
   */
  async sendOTP(email, purpose) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, {
        email,
        purpose,
      });
      return data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  },

  /**
   * Verify OTP and authenticate
   * @param {string} email - User email
   * @param {string} code - 6-digit OTP code
   * @param {'LOGIN'|'SIGNUP'} purpose - Purpose of OTP
   * @param {string} [name] - User name (required for signup)
   * @returns {Promise<Object>} User data and tokens
   */
  async verifyOTP(email, code, purpose, name) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        email,
        code,
        purpose,
        name,
      });

      if (data.success) {
        if (data.user) {
          apiClient.setUser(data.user);
        }
      }

      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  },

  /**
   * Resend OTP
   * @param {string} email - User email
   * @param {'LOGIN'|'SIGNUP'} purpose - Purpose of OTP
   * @returns {Promise<Object>} Response with success message
   */
  async resendOTP(email, purpose) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, {
        email,
        purpose,
      });
      return data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  },
};
