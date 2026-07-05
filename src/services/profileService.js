import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

/**
 * Profile Service
 * Handles user profile management operations
 */
class ProfileService {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      return response.user;
    } catch (error) {
      console.error('Get current profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.name - User's display name
   * @param {string} profileData.username - Username
   * @param {string} profileData.bio - User bio
   * @param {Object} profileData.socialLinks - Social media links
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.patch(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        profileData
      );
      return response.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   * @param {File} file - Avatar image file
   * @returns {Promise<Object>} Updated user data with new avatar URL
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.upload(
        API_ENDPOINTS.AUTH.UPLOAD_AVATAR,
        formData
      );
      return response.user;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  /**
   * Upload resume/CV
   * @param {File} file - Resume file (PDF, DOC, DOCX)
   * @returns {Promise<Object>} Updated user data with resume URL
   */
  async uploadResume(file) {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await apiClient.upload(
        API_ENDPOINTS.AUTH.UPLOAD_RESUME,
        formData
      );
      return response.user;
    } catch (error) {
      console.error('Upload resume error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        passwordData
      );
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * @param {string} password - User password for confirmation
   * @returns {Promise<Object>} Success response
   */
  async deleteAccount(password) {
    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.AUTH.DELETE_ACCOUNT,
        { data: { password } }
      );
      return response;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  /**
   * Get user's public profile by ID or username
   * @param {string} identifier - User ID or username
   * @returns {Promise<Object>} Public profile data
   */
  async getPublicProfile(identifier) {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.AUTH.GET_PROFILE.replace(':id', identifier)
      );
      return response.user;
    } catch (error) {
      console.error('Get public profile error:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await apiClient.patch(
        API_ENDPOINTS.AUTH.UPDATE_PREFERENCES,
        { notificationPreferences: preferences }
      );
      return response.preferences;
    } catch (error) {
      console.error('Update notification preferences error:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   * @returns {Promise<Object>} Current preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.AUTH.GET_PREFERENCES
      );
      return response.preferences;
    } catch (error) {
      console.error('Get notification preferences error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const profileService = new ProfileService();
export default profileService;
