/**
 * API Client
 * Centralized HTTP client with error handling and cookie-based authentication
 */

import { API_CONFIG, API_ERROR_CODES, DEFAULT_REQUEST_CONFIG } from '../config/api';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // ==================== User Management ====================

  /**
   * Clear user-specific data from localStorage on logout
   * Note: Tokens are HttpOnly cookies and will be cleared by the backend /auth/logout
   */
  clearUserData() {
    const user = localStorage.getItem('user');
    let userId = null;
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        userId = userData._id || userData.id;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    localStorage.removeItem('user');
    
    // Clear user-specific settings
    if (userId) {
      localStorage.removeItem(`accentColor_${userId}`);
      localStorage.removeItem(`theme_${userId}`);
    }
    
    localStorage.removeItem('accentColor');
    localStorage.removeItem('theme');
    
    // Reset accent color to default (teal)
    document.documentElement.style.setProperty('--color-primary', 'rgb(20, 184, 166)');
    document.documentElement.style.setProperty('--color-primary-rgb', '20, 184, 166');
  }

  /**
   * Store user data in localStorage
   */
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Get stored user data from localStorage
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // ==================== Request Queue Management ====================

  /**
   * Process failed request queue after token refresh
   */
  processQueue(error) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(); // Resolves so the queue can retry the requests
      }
    });
    this.failedQueue = [];
  }

  // ==================== Token Refresh ====================

  /**
   * Request backend to rotate the HttpOnly cookies using our existing refresh cookie
   */
  async refreshToken() {
    if (this.isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensures the refresh_token cookie is sent
      });

      const data = await response.json(); // Parse data first to access it for error logging
      
      if (!response.ok) {
        console.error('[API Error]', { status: response.status, data });
        throw new Error(data.message || 'Token refresh failed');
      }
      
      if (data.success) {
        // Tokens are automatically set as new HttpOnly cookies by the backend here.
        if (data.user) {
          this.setUser(data.user);
        }
        this.processQueue(null);
        return true;
      }

      throw new Error('Invalid refresh response');
    } catch (error) {
      this.processQueue(error);
      this.clearUserData();
      
      // Redirect to login if refresh fails
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // ==================== Core Request Method ====================

  /**
   * Make HTTP request with HTTP cookies and automatic error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...DEFAULT_REQUEST_CONFIG,
      ...options,
      credentials: 'include', // Ensure cookies are sent with every request
      headers: {
        ...DEFAULT_REQUEST_CONFIG.headers,
        ...options.headers,
      },
    };

    // Add timeout (allow custom timeout via options)
    const controller = new AbortController();
    const timeout = options.timeout || this.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle successful response
      if (response.ok) {
        return data;
      }

      // Handle 401 Unauthorized - trigger token refresh and retry
      if (response.status === API_ERROR_CODES.UNAUTHORIZED && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
        try {
          await this.refreshToken();
          // Retry original request since the backend issued new HttpOnly cookies
          return this.request(endpoint, options);
        } catch (refreshError) {
          throw new Error('Authentication failed. Please login again.');
        }
      }

      // Handle other errors
      const errorMessage = data.error?.message || data.message || 'Request failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;

    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network errors
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = API_ERROR_CODES.NETWORK_ERROR;
        throw timeoutError;
      }

      // Re-throw API errors
      throw error;
    }
  }

  // ==================== HTTP Method Helpers ====================

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * File upload (multipart/form-data)
   */
  async upload(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle successful response
      if (response.ok) {
        return data;
      }

      // Handle 401 Unauthorized - try token refresh
      if (response.status === API_ERROR_CODES.UNAUTHORIZED && endpoint !== '/api/auth/refresh') {
        try {
          await this.refreshToken();
          // Retry original request with new token
          return this.upload(endpoint, formData, options);
        } catch (refreshError) {
          throw new Error('Authentication failed. Please login again.');
        }
      }

      // Handle other errors
      const errorMessage = data.error?.message || data.message || 'Upload failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;

    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network errors
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Upload timeout');
        timeoutError.code = API_ERROR_CODES.NETWORK_ERROR;
        throw timeoutError;
      }

      // Re-throw API errors
      throw error;
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    // Note: Since tokens are HttpOnly cookies, we rely on the existence of the user object in localStorage 
    // as a proxy for the frontend knowing we are authenticated. The backend ultimately validates the true session.
    return !!this.getUser();
  }

  /**
   * Build query string from object
   */
  buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
