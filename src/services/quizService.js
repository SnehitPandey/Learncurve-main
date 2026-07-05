import { apiClient } from './api';

class QuizService {
  /**
   * Generate a new quiz for a specific room and user
   * @param {string} roomId 
   * @returns {Promise<Object>} Quiz object containing questions
   */
  async generateQuiz(roomId) {
    try {
      return await apiClient.post(`/api/rooms/${roomId}/quiz`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }

  /**
   * Submit quiz answers
   * @param {string} roomId 
   * @param {string} quizId 
   * @param {number[]} answers Array of chosen option indices
   * @returns {Promise<Object>} Quiz result with score
   */
  async submitAnswers(roomId, quizId, answers) {
    try {
      return await apiClient.post(`/api/rooms/${roomId}/quiz/${quizId}/submit`, { answers });
    } catch (error) {
      console.error('Error submitting quiz answers:', error);
      throw error;
    }
  }

  /**
   * Get an existing quiz
   * @param {string} roomId 
   * @param {string} quizId 
   * @returns {Promise<Object>} 
   */
  async getQuiz(roomId, quizId) {
    try {
      return await apiClient.get(`/api/rooms/${roomId}/quiz/${quizId}`);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }
}

export const quizService = new QuizService();
