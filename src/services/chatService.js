/**
 * Chat Service
 * Handles all chat-related API calls
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

export const chatService = {
  /**
   * Get chat messages for a room
   * @param {string} roomId - Room ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of messages to fetch (1-100)
   * @param {string} options.cursor - Cursor for pagination
   * @param {string} options.since - ISO datetime string
   * @param {string} options.order - 'asc' or 'desc'
   * @returns {Promise<Object>} Messages and pagination data
   */
  async getMessages(roomId, options = {}) {
    try {
      const queryString = apiClient.buildQueryString({
        limit: options.limit || 20,
        cursor: options.cursor,
        since: options.since,
        order: options.order || 'desc',
      });

      const endpoint = `${API_ENDPOINTS.CHAT.MESSAGES(roomId)}?${queryString}`;
      const data = await apiClient.get(endpoint);
      const messages = data?.messages || data?.data?.messages || data?.data?.items || [];
      const pagination = data?.pagination || data?.data?.pagination || null;
      return {
        ...data,
        success: data?.success ?? true,
        messages,
        pagination,
      };
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  /**
   * Get message statistics for a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Message statistics
   */
  async getMessageStats(roomId) {
    try {
      const data = await apiClient.get(API_ENDPOINTS.CHAT.STATS(roomId));
      return {
        ...data,
        success: data?.success ?? true,
        stats: data?.stats || data?.data || {},
      };
    } catch (error) {
      console.error('Get message stats error:', error);
      throw error;
    }
  },
};
