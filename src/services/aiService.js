/**
 * AI Service
 * Handles all AI-related API calls.
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

const AI_TIMEOUT = 60000;

const normalizeResponse = (response) => {
  if (response && typeof response === 'object' && response.success && response.data !== undefined) {
    return { ...response, ...response.data };
  }
  return response;
};

export const aiService = {
  async generateRoadmap(input) {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.AI.ROADMAP,
        {
          goal: input.goal,
          tags: input.tags,
          skillLevel: (input.skillLevel || 'beginner').toLowerCase(),
          durationWeeks: input.durationWeeks || 12,
        },
        { timeout: AI_TIMEOUT }
      );
      return normalizeResponse(data);
    } catch (error) {
      console.error('Generate roadmap error:', error);
      throw error;
    }
  },

  async generateQuiz(input) {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.AI.QUIZ,
        {
          topic: input.topic,
          currentMilestone: input.currentMilestone,
          difficulty: input.difficulty,
          count: input.count,
          userProgress: input.userProgress,
        },
        { timeout: AI_TIMEOUT }
      );
      return normalizeResponse(data);
    } catch (error) {
      console.error('Generate quiz error:', error);
      throw error;
    }
  },

  async generateRoomRoadmap(roomId) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/roadmap/generate`,
        {},
        { timeout: AI_TIMEOUT }
      );
      return normalizeResponse(data);
    } catch (error) {
      console.error('Generate room roadmap error:', error);
      throw error;
    }
  },

  async generateRoomQuiz(roomId, options = {}) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/quiz/generate`,
        options,
        { timeout: AI_TIMEOUT }
      );
      return normalizeResponse(data);
    } catch (error) {
      console.error('Generate room quiz error:', error);
      throw error;
    }
  },

  async updateRoomProgress(roomId, progress) {
    try {
      const data = await apiClient.put(`/api/rooms/${roomId}/progress`, progress);
      return normalizeResponse(data);
    } catch (error) {
      console.error('Update room progress error:', error);
      throw error;
    }
  },

  async embedProfile(userId, profile) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AI.EMBED_PROFILE, {
        userId,
        profile,
      });
      return normalizeResponse(data);
    } catch (error) {
      console.error('Embed profile error:', error);
      throw error;
    }
  },

  async getEmbeddingStatus(userId) {
    try {
      const data = await apiClient.get(API_ENDPOINTS.AI.EMBEDDING_STATUS(userId));
      return normalizeResponse(data);
    } catch (error) {
      console.error('Get embedding status error:', error);
      throw error;
    }
  },

  async groupStudents(input) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AI.GROUP_STUDENTS, {
        count: input.count,
        groupType: input.groupType,
        algorithm: input.algorithm,
      });
      return normalizeResponse(data);
    } catch (error) {
      console.error('Group students error:', error);
      throw error;
    }
  },

  async getEmbeddingStats() {
    try {
      const data = await apiClient.get(API_ENDPOINTS.AI.STATS);
      return normalizeResponse(data);
    } catch (error) {
      console.error('Get embedding stats error:', error);
      throw error;
    }
  },

  async generateRoomSummary(input) {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.AI.ROOM_SUMMARY,
        {
          roomTitle: input.roomTitle,
          description: input.description,
          topics: input.topics,
          durationDays: input.durationDays,
          skillLevel: input.skillLevel,
          dailyTime: input.dailyTime,
          goal: input.goal,
        },
        { timeout: AI_TIMEOUT }
      );
      return normalizeResponse(data);
    } catch (error) {
      console.error('Generate room summary error:', error);
      throw error;
    }
  },

  async generateText(input) {
    try {
      const data = await apiClient.post(
        '/api/ai/text',
        {
          prompt: input.prompt,
          maxTokens: input.maxTokens || 200,
        },
        { timeout: AI_TIMEOUT }
      );
      return normalizeResponse(data);
    } catch (error) {
      console.error('Generate text error:', error);
      throw error;
    }
  },
};
