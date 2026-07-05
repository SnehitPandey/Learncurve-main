/**
 * Notification Service
 * Handles all notification-related API calls
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

export const notificationService = {
  /**
   * Get user's notifications
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (1-50, default: 20)
   * @returns {Promise<Object>} Notifications and pagination data
   */
  async getNotifications(options = {}) {
    try {
      // Mocked response for development since backend endpoint doesn't exist
      return { 
        success: true, 
        notifications: [], 
        unreadCount: 0, 
        pagination: { 
          page: options.page || 1, 
          limit: options.limit || 20, 
          total: 0, 
          pages: 1 
        } 
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount() {
    try {
      // Get first page with minimal data to check unread count
      const data = await this.getNotifications({ page: 1, limit: 1 });
      return data.unreadCount || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0; // Return 0 on error to avoid breaking UI
    }
  },

  /**
   * Mark specific notifications as read
   * @param {string[]} notificationIds - Array of notification IDs (1-100)
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(notificationIds) {
    try {
      // Mocked response
      return { success: true };
    } catch (error) {
      console.error('Mark notifications as read error:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead() {
    try {
      // Mocked response
      return { success: true };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  },
};
