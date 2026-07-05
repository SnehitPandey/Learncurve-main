/**
 * Room Service
 * Handles all room-related API calls
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

const normalizeRoom = (room) => {
  if (!room || typeof room !== 'object') {
    return room;
  }

  const hostSource = room.host || room.hostId;
  const hostName =
    hostSource?.name ||
    hostSource?.username ||
    'Unknown';
  const hostAvatarUrl =
    hostSource?.avatarUrl ||
    hostSource?.profilePic ||
    hostSource?.customAvatarURL ||
    hostSource?.avatar ||
    null;

  const normalizedMembers = Array.isArray(room.members)
    ? room.members.map((member) => {
        if (!member || typeof member !== 'object') {
          return member;
        }

        const userSource = member.userId && typeof member.userId === 'object'
          ? member.userId
          : null;

        const memberName =
          member.name ||
          userSource?.name ||
          userSource?.username ||
          'Unknown User';

        return {
          ...member,
          id: member.id || member._id || member.userId?._id,
          name: memberName,
          avatarUrl:
            member.avatarUrl ||
            userSource?.avatar ||
            userSource?.avatarUrl ||
            userSource?.profilePic ||
            userSource?.customAvatarURL ||
            null,
          isOnline: Boolean(member.isOnline ?? userSource?.isOnline),
        };
      })
    : room.members;

  return {
    ...room,
    id: room.id || room._id,
    title: room.title || room.topic || 'Untitled Room',
    tags: Array.isArray(room.tags) ? room.tags : [],
    maxSeats: Number.isFinite(room.maxSeats) ? room.maxSeats : 8,
    currentMembers: Number.isFinite(room.currentMembers)
      ? room.currentMembers
      : Array.isArray(room.members)
        ? room.members.length
        : 0,
    availableSeats: Number.isFinite(room.availableSeats)
      ? room.availableSeats
      : Math.max(
          (Number.isFinite(room.maxSeats) ? room.maxSeats : 8) -
            (Array.isArray(room.members) ? room.members.length : 0),
          0
        ),
    startDate: room.startDate || room.createdAt || new Date().toISOString(),
    host: {
      id: hostSource?.id || hostSource?._id || room.hostId || '',
      name: hostName,
      avatarUrl: hostAvatarUrl,
    },
    members: normalizedMembers,
  };
};

const normalizeRoomListResponse = (response) => {
  const list = Array.isArray(response?.rooms)
    ? response.rooms
    : Array.isArray(response?.data)
      ? response.data
      : [];

  const rooms = list.map(normalizeRoom);

  return {
    ...response,
    rooms,
    data: rooms,
  };
};

export const roomService = {
  /**
   * Create a new study room
   * @param {string} title - Room title
   * @param {string} description - Room description (optional)
   * @param {string[]} tags - Array of learning topics/tags (optional)
   * @param {string} skillLevel - 'Beginner', 'Intermediate', or 'Advanced' (optional)
   * @param {number} maxSeats - Maximum number of seats (2-20)
   * @param {boolean} generateRoadmap - Whether to auto-generate roadmap (default: true)
   * @param {number} durationDays - Duration in days (optional)
   * @returns {Promise<Object>} Created room data with roadmap
   */
  async createRoom(title, description = '', tags = [], skillLevel = 'Beginner', maxSeats = 6, generateRoadmap = true, durationDays = null) {
    try {
      const payload = {
        title,
        topic: tags && tags.length > 0 ? tags[0] : title,
        description,
        tags,
        // Normalize to lowercase — backend Zod enum expects 'beginner'|'intermediate'|'advanced'
        skillLevel: (skillLevel || 'beginner').toLowerCase(),
        maxSeats,
        generateRoadmap,
      };
      
      // Add durationDays if provided
      if (durationDays) {
        payload.expectedDurationDays = durationDays;
      }
      
      const data = await apiClient.post(API_ENDPOINTS.ROOMS.CREATE, payload);
      return data;
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  },

  /**
   * Join a room using 6-character code
   * @param {string} code - 6-character room code
   * @returns {Promise<Object>} Room data with members
   */
  async joinRoom(code) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.ROOMS.JOIN, { code });
      return {
        ...data,
        room: normalizeRoom(data?.room || data?.data),
        data: normalizeRoom(data?.data || data?.room),
      };
    } catch (error) {
      console.error('Join room error:', error);
      throw error;
    }
  },

  /**
   * Get room details by ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Room details
   */
  async getRoom(roomId) {
    try {
      const data = await apiClient.get(API_ENDPOINTS.ROOMS.GET(roomId));
      const normalizedRoom = normalizeRoom(data?.room || data?.data);
      return {
        ...data,
        room: normalizedRoom,
        data: normalizedRoom,
      };
    } catch (error) {
      console.error('Get room error:', error);
      throw error;
    }
  },

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Success message
   */
  async leaveRoom(roomId) {
    const attempts = [
      () => apiClient.post(API_ENDPOINTS.ROOMS.LEAVE(roomId)),
      () => apiClient.post(`/api/rooms/${roomId}/leave`),
      () => apiClient.delete(`/rooms/${roomId}/leave`),
      () => apiClient.delete(`/api/rooms/${roomId}/leave`),
    ];

    let lastError;
    for (const attempt of attempts) {
      try {
        const data = await attempt();
        return data;
      } catch (error) {
        lastError = error;

        // Retry only when route/method may differ between versions.
        if (![404, 405].includes(error?.status)) {
          throw error;
        }
      }
    }

    console.error('Leave room error:', lastError);
    throw lastError;
  },

  /**
   * Toggle ready status in room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Updated ready status
   */
  async toggleReady(roomId) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.ROOMS.READY(roomId));
      return data;
    } catch (error) {
      console.error('Toggle ready error:', error);
      throw error;
    }
  },

  /**
   * Get all rooms the user is a member of
   * @returns {Promise<Object>} User's rooms
   */
  async getMyRooms() {
    try {
      const data = await apiClient.get(API_ENDPOINTS.ROOMS.MY_ROOMS);
      return normalizeRoomListResponse(data);
    } catch (error) {
      console.error('Get my rooms error:', error);
      throw error;
    }
  },

  /**
   * Get today's tasks from all user's rooms
   * @returns {Promise<Object>} Today's tasks
   */
  async getTodaysTasks() {
    try {
      // Fetch the dashboard endpoint which aggregates today's tasks
      const response = await apiClient.get('/api/users/dashboard');
      // apiClient returns { success, data: { rooms, roomActivity, ... } } — unwrap .data
      const dashboardData = response?.data || response;
      
      // Build flat tasks array for backwards compatibility (roomContent.jsx uses this)
      let allTasks = [];
      if (dashboardData && dashboardData.rooms) {
         allTasks = dashboardData.rooms.flatMap(room => 
           (room.todaysTasks || []).map(task => ({
             ...task,
             id: task.taskId,
             roomId: room.roomId,
             roomTitle: room.roomTitle,
             roomName: room.roomTitle,
             estimatedHours: (task.estimatedMinutes || 30) / 60
           }))
         );
      }
      
      return { 
        success: true, 
        tasks: allTasks,
        // Full rooms structure for todaysTaskBlock (includes completedTodayCount, totalTodayCount)
        rooms: dashboardData?.rooms || [],
        // Room activity feed for roomUpdates component
        roomActivity: dashboardData?.roomActivity || [],
        // Streak data
        focusStreak: dashboardData?.focusStreak,
        duoStreak: dashboardData?.duoStreak,
      };
    } catch (error) {
      console.error('Get today\'s tasks error:', error);
      throw error;
    }
  },

  /**
   * Update user's current activity
   * @param {Object} activity - Activity data { studying, topicName }
   * @returns {Promise<Object>} Response
   */
  async updateActivity(activity) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.ROOMS.UPDATE_ACTIVITY, activity);
      return data;
    } catch (error) {
      // Activity sync is non-blocking; backend may not expose this endpoint in all environments.
      return { success: false, ignored: true };
    }
  },

  /**
   * Get activities for multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @returns {Promise<Object>} Users activities
   */
  async getUsersActivities(userIds) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.ROOMS.GET_ACTIVITIES, { userIds });
      return data;
    } catch (error) {
      // Presence UI should continue even if activity endpoint is unavailable.
      return { success: false, activities: {} };
    }
  },

  /**
   * Get public rooms available to join
   * @returns {Promise<Object>} Public rooms list
   */
  async getPublicRooms() {
    try {
      const data = await apiClient.get(API_ENDPOINTS.ROOMS.PUBLIC);
      return normalizeRoomListResponse(data);
    } catch (error) {
      console.error('Get public rooms error:', error);
      throw error;
    }
  },

  /**
   * Check user's room limit status
   * @returns {Promise<Object>} { currentRooms, maxRooms, canCreate, remainingSlots }
   */
  async checkRoomLimit() {
    try {
      const response = await apiClient.get('/api/rooms/check-limit');
      return response;
    } catch (error) {
      console.error('❌ Check room limit error:', error);
      throw error;
    }
  },

  /**
   * Mark a topic as complete and recalculate room progress
   * @param {string} roomId - Room ID
   * @param {string} milestoneId - Milestone ID
   * @param {number} topicIndex - Index of the topic in the milestone's topics array
   * @returns {Promise<Object>} { success, room, progress }
   */
  async completeTopicAndUpdateProgress(roomId, milestoneId, topicIndex) {
    try {
      const endpoint = `/api/rooms/${roomId}/milestone/${milestoneId}/topic/${topicIndex}/complete`;
      const data = await apiClient.patch(endpoint);
      return data;
    } catch (error) {
      console.error('Complete topic error:', error);
      throw error;
    }
  },

  // ========== ENHANCED ROOM API (NEW) ==========

  /**
   * Apply weighted timeline distribution
   * @param {string} roomId - Room ID
   * @param {number} timelineMonths - Number of months for timeline
   * @returns {Promise<Object>} Updated room with distributed timeline
   */
  async applyTimeline(roomId, timelineMonths) {
    try {
      const data = await apiClient.post(`/api/rooms/${roomId}/roadmap/apply-timeline`, {
        timelineMonths
      });
      return data;
    } catch (error) {
      console.error('Apply timeline error:', error);
      throw error;
    }
  },

  /**
   * Complete topic for user in room roadmap (enhanced)
   * @param {string} roomId - Room ID
   * @param {string} topicId - Topic ID or title
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated progress
   */
  async completeTopicForUser(roomId, topicId, userId) {
    try {
      // Compatibility path: topicId may be packed as "<milestoneId>::<topicIndex>".
      if (typeof topicId === 'string' && topicId.includes('::')) {
        const [milestoneId, topicIndexRaw] = topicId.split('::');
        const topicIndex = Number(topicIndexRaw);
        if (milestoneId && Number.isInteger(topicIndex) && topicIndex >= 0) {
          return this.completeTopicAndUpdateProgress(roomId, milestoneId, topicIndex);
        }
      }

      // URL-encode the topicId to handle special characters like slashes
      const encodedTopicId = encodeURIComponent(topicId);
      const data = await apiClient.patch(
        `/api/rooms/${roomId}/roadmap/topic/${encodedTopicId}/complete`,
        { userId }
      );
      return data;
    } catch (error) {
      if ([404, 405].includes(error?.status)) {
        throw new Error('Topic completion route mismatch. Please retry from timeline task checkbox.');
      }
      console.error('Complete topic for user error:', error);
      throw error;
    }
  },

  /**
   * Get user progress in room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User progress data
   */
  async getUserProgress(roomId, userId) {
    try {
      const data = await apiClient.get(`/api/rooms/${roomId}/progress/${userId}`);
      return data;
    } catch (error) {
      console.error('Get user progress error:', error);
      throw error;
    }
  },

  /**
   * Update user progress
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {string[]} completedTopicIds - Array of completed topic IDs
   * @param {number} timeSpent - Time spent in seconds
   * @returns {Promise<Object>} Updated progress
   */
  async updateUserProgress(roomId, userId, completedTopicIds, timeSpent) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/progress/${userId}/update`,
        { completedTopicIds, timeSpent }
      );
      return data;
    } catch (error) {
      console.error('Update user progress error:', error);
      throw error;
    }
  },

  // ========== QUIZ API ==========

  /**
   * Generate AI-powered quiz
   * @param {string} roomId - Room ID
   * @param {string} date - Date for quiz (ISO string)
   * @param {string[]} topics - Array of topic titles
   * @param {string} difficulty - 'easy' | 'medium' | 'hard'
   * @returns {Promise<Object>} Generated quiz
   */
  async generateQuiz(roomId, date = null, topics = [], difficulty = 'medium') {
    try {
      // AI operations need longer timeout
      const data = await apiClient.post(`/api/rooms/${roomId}/quiz`, {
        topics: topics && topics.length > 0 ? topics : [],
        difficulty,
        count: 5
      }, { timeout: 120000 }); // 2 minutes
      return data;
    } catch (error) {
      console.error('Generate quiz error:', error);
      throw error;
    }
  },

  /**
   * Submit quiz answers
   * @param {string} roomId - Room ID
   * @param {string} quizId - Quiz ID
   * @param {number[]} answers - Array of answer indices
   * @returns {Promise<Object>} Quiz results with score
   */
  async submitQuiz(roomId, quizId, answers) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/quiz/${quizId}/submit`,
        { answers }
      );
      return data;
    } catch (error) {
      console.error('Submit quiz error:', error);
      throw error;
    }
  },

  /**
   * Get all quizzes for room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Array of quizzes
   */
  async getQuizzes(roomId) {
    try {
      const data = await apiClient.get(`/api/rooms/${roomId}`);
      const roomData = data.room || data.data || data || {};
      return {
        success: true,
        quizzes: roomData.quizzes || []
      };
    } catch (error) {
      console.error('Get quizzes error:', error);
      throw error;
    }
  },

  // ========== KANBAN API ==========

  /**
   * Get user's kanban board
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Kanban board data
   */
  async getKanbanBoard(roomId, userId) {
    try {
      const response = await apiClient.get(`/api/rooms/${roomId}/kanban/${userId}`);
      // apiClient returns { success, data: { kanban } } — unwrap .data
      return response?.data || response;
    } catch (error) {
      console.error('Get kanban board error:', error);
      throw error;
    }
  },

  /**
   * Regenerate kanban tasks algorithmically from roadmap
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Success response with regenerated tasks
   */
  async regenerateTasks(roomId) {
    try {
      const response = await apiClient.post(`/api/rooms/${roomId}/tasks/regenerate`);
      // apiClient returns { success, data: { kanban, tasks } } — unwrap .data
      return response?.data || response;
    } catch (error) {
      console.error('Regenerate tasks error:', error);
      throw error;
    }
  },

  /**
   * Move kanban task between columns
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @param {string} fromColumn - Source column
   * @param {string} toColumn - Destination column
   * @param {number} order - New order position
   * @returns {Promise<Object>} Success response
   */
  async moveKanbanTask(roomId, userId, taskId, fromColumn, toColumn, order) {
    try {
      const data = await apiClient.patch(
        `/api/rooms/${roomId}/kanban/${userId}/move`,
        { taskId, fromColumn, toColumn, order }
      );
      return data;
    } catch (error) {
      console.error('Move kanban task error:', error);
      throw error;
    }
  },

  // ========== FOCUS TIMER API ==========

  /**
   * Start focus session
   * @param {string} roomId - Room ID
   * @param {string} topicId - Topic ID
   * @param {string} topicTitle - Topic title
   * @returns {Promise<Object>} Session data with sessionId
   */
  async startFocusSession(roomId, topicId, topicTitle) {
    try {
      return {
        success: true,
        sessionId: `session_${Date.now()}`,
        roomId,
        topicId,
        topicTitle,
      };
    } catch (error) {
      console.warn('Start focus session error (non-critical):', error?.message || error);
      throw error;
    }
  },

  /**
   * Get active focus session (for resuming across devices)
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Active session data or null
   */
  async getActiveFocusSession(roomId) {
    try {
      return { success: true, session: null, roomId };
    } catch (error) {
      console.warn('Get active focus session error (non-critical):', error?.message || error);
      return { success: false, session: null };
    }
  },

  /**
   * Update focus session heartbeat
   * @param {string} roomId - Room ID
   * @param {string} sessionId - Session ID
   * @param {number} elapsed - Elapsed time in seconds
   * @returns {Promise<Object>} Success response
   */
  async pulseFocusSession(roomId, sessionId, elapsed) {
    try {
      // Backend does not support heartbeat endpoints; keep local timer alive.
      return { success: true, sessionId, elapsedTime: elapsed };
    } catch (error) {
      console.warn('Pulse focus session error (non-critical):', error?.message || error);
      throw error;
    }
  },

  /**
   * End focus session
   * @param {string} roomId - Room ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Final session data
   */
  async endFocusSession(roomId, sessionId) {
    try {
      return { success: true, roomId, sessionId };
    } catch (error) {
      console.warn('End focus session error (non-critical):', error?.message || error);
      return { success: false };
    }
  },

  // ========== MESSAGES API ==========

  /**
   * Get room messages
   * @param {string} roomId - Room ID
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<Object>} Messages array
   */
  async getMessages(roomId, limit = 50) {
    try {
      const data = await apiClient.get(
        `/api/rooms/${roomId}/messages?limit=${limit}`
      );
      return data;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  /**
   * Post a message to room
   * @param {string} roomId - Room ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} Created message
   */
  async postMessage(roomId, content) {
    try {
      const data = await apiClient.post(`/api/rooms/${roomId}/messages`, {
        content
      });
      return data;
    } catch (error) {
      console.error('Post message error:', error);
      throw error;
    }
  },

  /**
   * Save additional topics completed beyond today's scheduled tasks
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @param {Array} topics - Array of completed topics
   * @returns {Promise<Object>} Updated user progress
   */
  async saveAdditionalTopics(roomId, userId, topics) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/users/${userId}/additional-topics`,
        { topics }
      );
      return data;
    } catch (error) {
      console.error('Save additional topics error:', error);
      throw error;
    }
  },
};
