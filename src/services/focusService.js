import { apiClient } from './api';

class FocusService {
  /**
   * Complete a focus session and get the AI summary
   * @param {string} roomId 
   * @param {string} topicId 
   * @param {number} durationMinutes 
   * @returns {Promise<Object>} Focus session result with summary and updated progress
   */
  async completeFocusSession(roomId, topicId, durationMinutes) {
    try {
      return await apiClient.post(`/api/rooms/${roomId}/focus`, { 
        topicId, 
        durationMinutes 
      });
    } catch (error) {
      console.error('Error completing focus session:', error);
      throw error;
    }
  }

  /**
   * Get user's focus sessions for a room
   * @param {string} roomId 
   * @returns {Promise<Array>} List of focus sessions
   */
  async getUserFocusSessions(roomId) {
    try {
      return await apiClient.get(`/api/rooms/${roomId}/focus`);
    } catch (error) {
      console.error('Error fetching focus sessions:', error);
      throw error;
    }
  }
}

export const focusService = new FocusService();
