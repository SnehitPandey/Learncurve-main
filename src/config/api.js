/**
 * API Configuration
 * Central configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '',
  TIMEOUT: 10000,
  ENV: import.meta.env.VITE_ENV || 'development',
};

// All API endpoints organized by feature
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    UPLOAD_AVATAR: '/auth/avatar',
    UPLOAD_RESUME: '/auth/resume',
    CHANGE_PASSWORD: '/auth/password',
    DELETE_ACCOUNT: '/auth/account',
    GET_PROFILE: '/auth/profile/:id',
    UPDATE_PREFERENCES: '/auth/preferences',
    GET_PREFERENCES: '/auth/preferences',
    // OTP authentication endpoints
    SEND_OTP: '/auth/otp/send',
    VERIFY_OTP: '/auth/otp/verify',
    RESEND_OTP: '/auth/otp/resend',
  },

  // Room endpoints
  ROOMS: {
    CREATE: '/rooms',
    JOIN: '/rooms/join',
    LIST: '/rooms',
    MY_ROOMS: '/rooms', // Fixed to match backend root route
    PUBLIC: '/rooms/public',
    TODAYS_TASKS: '/rooms/todays-tasks',
    CHECK_LIMIT: '/rooms/check-limit',
    UPDATE_ACTIVITY: '/rooms/activity/update',
    GET_ACTIVITIES: '/rooms/activity/batch',
    GET: (id) => `/rooms/${id}`,
    LEAVE: (id) => `/rooms/${id}/leave`,
    READY: (id) => `/rooms/${id}/ready`,
  },

  // Chat endpoints
  CHAT: {
    MESSAGES: (roomId) => `/rooms/${roomId}/messages`,
    STATS: (roomId) => `/rooms/${roomId}/stats`,
  },

  // Channel endpoints
  CHANNELS: {
    CREATE: '/channels',
    LIST: '/channels',
    MY_CHANNELS: '/channels/my',
    GET: (id) => `/channels/${id}`,
    UPDATE: (id) => `/channels/${id}`,
    DELETE: (id) => `/channels/${id}`,
    // Note endpoints
    CREATE_NOTE: (channelId) => `/channels/${channelId}/notes`,
    GET_NOTES: (channelId) => `/channels/${channelId}/notes`,
    GET_NOTE: (channelId, noteId) => `/channels/${channelId}/notes/${noteId}`,
    UPDATE_NOTE: (channelId, noteId) => `/channels/${channelId}/notes/${noteId}`,
    DELETE_NOTE: (channelId, noteId) => `/channels/${channelId}/notes/${noteId}`,
  },

  // Task/Board endpoints
  TASKS: {
    CREATE_BOARD: '/boards',
    GET_BOARDS: '/boards',
    GET_BOARD: (id) => `/boards/${id}`,
    UPDATE_BOARD: (id) => `/boards/${id}`,
    DELETE_BOARD: (id) => `/boards/${id}`,
    CREATE_LIST: '/lists',
    UPDATE_LIST: (id) => `/lists/${id}`,
    DELETE_LIST: (id) => `/lists/${id}`,
    CREATE_TASK: '/tasks',
    GET_TASK: (id) => `/tasks/${id}`,
    UPDATE_TASK: (id) => `/tasks/${id}`,
    DELETE_TASK: (id) => `/tasks/${id}`,
  },

  // AI endpoints
  AI: {
    ROADMAP: '/ai/roadmap',
    QUIZ: '/ai/quiz',
    ROOM_SUMMARY: '/ai/room-summary',
    EMBED_PROFILE: '/ai/embed-profile',
    EMBEDDING_STATUS: (userId) => `/ai/embedding/${userId}`,
    GROUP_STUDENTS: '/ai/group-students',
    STATS: '/ai/stats',
  },

  // Content generation endpoints
  CONTENT: {
    GENERATE: '/content/generate',
  },

  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read',
  },

  // Health check endpoints
  HEALTH: {
    CHECK: '/health',
    DB_CHECK: '/db-check',
    API_INFO: '/api',
  },
};

// API error codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 'NETWORK_ERROR',
};

// Default request configuration
export const DEFAULT_REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
};
