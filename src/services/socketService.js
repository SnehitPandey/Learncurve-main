/**
 * Socket Service
 * Handles WebSocket connections for real-time features
 */

import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { apiClient } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupDefaultListeners();
  }

  /**
   * Setup default socket event listeners
   */
  setupDefaultListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      
      // Attempt to reconnect on certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        setTimeout(() => this.socket.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (error && error.message) {
        console.error('Error message:', error.message);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  // ==================== Room Events ====================

  /**
   * Join a room
   * @param {string} roomId - Room ID
   */
  joinRoom(roomId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('JOIN_ROOM', { roomId });
    console.log('Joining room:', roomId);
  }

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   */
  leaveRoom(roomId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('LEAVE_ROOM', { roomId });
    console.log('Leaving room:', roomId);
  }

  /**
   * Send chat message
   * @param {string} roomId - Room ID
   * @param {string} content - Message content
   * @param {string} type - Message type ('TEXT', 'EMOJI', 'FILE')
   */
  sendMessage(roomId, content, type = 'TEXT') {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('SEND_MESSAGE', { roomId, content, type });
  }

  /**
   * Listen for updated room presence (list of users in room)
   * @param {Function} callback
   */
  onRoomUsers(callback) {
    // Legacy backend emitted roomUsers; keep compatibility by listening if available.
    this.on('roomUsers', callback);
  }

  /**
   * Listen for system messages (join/leave notifications)
   * @param {Function} callback
   */
  onSystemMessage(callback) {
    // Bridge modern room events to legacy callback contract used by room page.
    this.on('systemMessage', callback);
    this.on('USER_JOINED_ROOM', (payload) => callback({ type: 'join', ...payload, timestamp: new Date().toISOString() }));
    this.on('USER_LEFT_ROOM', (payload) => callback({ type: 'leave', ...payload, timestamp: new Date().toISOString() }));
  }

  /**
   * Toggle ready status
   * @param {string} roomId - Room ID
   */
  toggleReady(roomId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('toggle-ready', { roomId });
  }

  /**
   * Send typing indicator
   * @param {string} roomId - Room ID
   * @param {boolean} isTyping - Typing status
   */
  sendTyping(roomId, isTyping) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('chat:typing', { roomId, isTyping });
  }

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   */
  leaveRoom(roomId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('LEAVE_ROOM', { roomId });
  }

  // ==================== Event Listeners ====================

  /**
   * Listen for new messages
   * @param {Function} callback - Callback function
   */
  onMessage(callback) {
    this.on('NEW_MESSAGE', callback);
  }

  /**
   * Listen for system messages (join/leave) - new format
   * @param {Function} callback - Callback function
   */
  onSystemMessageNew(callback) {
    this.on('chat:system', callback);
  }

  /**
   * Listen for chat history
   * @param {Function} callback - Callback function
   */
  onChatHistory(callback) {
    this.on('chatHistory', callback);
  }

  /**
   * Listen for typing indicator
   * @param {Function} callback - Callback function
   */
  onChatTyping(callback) {
    this.on('chat:typing', callback);
  }

  /**
   * Listen for user joined event
   * @param {Function} callback - Callback function
   */
  onUserJoined(callback) {
    this.on('user-joined', callback);
  }

  /**
   * Listen for user left event
   * @param {Function} callback - Callback function
   */
  onUserLeft(callback) {
    this.on('user-left', callback);
  }

  /**
   * Listen for user ready status change
   * @param {Function} callback - Callback function
   */
  onReadyStatusChanged(callback) {
    this.on('ready-status-changed', callback);
  }

  /**
   * Listen for room updated event
   * @param {Function} callback - Callback function
   */
  onRoomUpdated(callback) {
    this.on('room-updated', callback);
  }

  /**
   * Listen for typing indicator
   * @param {Function} callback - Callback function
   */
  onTyping(callback) {
    this.on('typing', callback);
  }

  /**
   * Listen for notifications
   * @param {Function} callback - Callback function
   */
  onNotification(callback) {
    this.on('notification', callback);
  }

  // ==================== Generic Event Handling ====================

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    // Store listener reference for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function (optional)
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from listeners map
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.listeners.clear();
    }
  }

  /**
   * Emit custom event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Backward compatibility: export 'socket' as an alias to socketService
// This prevents import errors if any cached modules still reference it
export const socket = socketService;

// Also export as default
export default socketService;
