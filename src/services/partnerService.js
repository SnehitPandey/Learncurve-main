import { apiClient } from './api';

class PartnerService {
  /**
   * Send a partner invite to another user by email
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async sendInvite(email) {
    try {
      return await apiClient.post('/api/users/partner/invite', { email });
    } catch (error) {
      console.error('Error sending partner invite:', error);
      throw error;
    }
  }

  /**
   * Accept a pending partner invite
   * @returns {Promise<Object>}
   */
  async acceptInvite() {
    try {
      return await apiClient.post('/api/users/partner/accept');
    } catch (error) {
      console.error('Error accepting partner invite:', error);
      throw error;
    }
  }

  /**
   * Dissolve the current partnership
   * @returns {Promise<Object>}
   */
  async dissolvePartnership() {
    try {
      return await apiClient.delete('/api/users/partner');
    } catch (error) {
      console.error('Error dissolving partnership:', error);
      throw error;
    }
  }

  /**
   * Get current partner information
   * @returns {Promise<Object>}
   */
  async getPartnerInfo() {
    try {
      return await apiClient.get('/api/users/partner');
    } catch (error) {
      console.error('Error fetching partner info:', error);
      throw error;
    }
  }
}

export const partnerService = new PartnerService();
