/**
 * Discord-style Presence Hook
 * Manages real-time user presence with heartbeat mechanism
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity = idle

/**
 * Hook for managing Discord-style presence
 * @param {Object} user - Current user object with id and username
 * @returns {Object} - Presence state and update functions
 */
export const useDiscordPresence = (user) => {
  const resolvedUserId = user?.id || user?._id;
  const resolvedUsername = user?.username || user?.name;

  // Store all user presence states
  const [presenceMap, setPresenceMap] = useState({});
  
  // Track if presence is initialized
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for intervals and timers
  const heartbeatInterval = useRef(null);
  const idleTimer = useRef(null);
  const lastActivityTime = useRef(Date.now());
  const isIdleRef = useRef(false);

  /**
   * Send heartbeat to server
   */
  const sendHeartbeat = useCallback(() => {
    if (socketService.isConnected()) {
      socketService.emit('presence:heartbeat');
      console.log('[Presence] 💓 Heartbeat sent');
    }
  }, []);

  /**
   * Update user status
   */
  const updateStatus = useCallback((status, activity = null) => {
    if (!socketService.isConnected()) {
      console.warn('[Presence] Cannot update status: socket not connected');
      return;
    }

    socketService.emit('presence:update', { status, activity });
    console.log(`[Presence] Status updated: ${status}${activity ? ` - ${activity}` : ''}`);
  }, []);

  /**
   * Update user activity
   */
  const updateActivity = useCallback((activity) => {
    if (!socketService.isConnected()) return;

    socketService.emit('presence:update', { activity });
    console.log(`[Presence] Activity updated: ${activity}`);
    
    // Reset idle timer when user is active
    lastActivityTime.current = Date.now();
    if (isIdleRef.current) {
      isIdleRef.current = false;
      updateStatus('online', activity);
    }
  }, [updateStatus]);

  /**
   * Set user as idle
   */
  const setIdle = useCallback(() => {
    if (isIdleRef.current) return; // Already idle
    
    isIdleRef.current = true;
    updateStatus('idle', null);
    console.log('[Presence] User marked as idle');
  }, [updateStatus]);

  /**
   * Set user as online
   */
  const setOnline = useCallback(() => {
    if (!isIdleRef.current) return; // Already online
    
    isIdleRef.current = false;
    lastActivityTime.current = Date.now();
    updateStatus('online');
    console.log('[Presence] User marked as online');
  }, [updateStatus]);

  /**
   * Check for idle status based on activity
   */
  const checkIdleStatus = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityTime.current;

    if (timeSinceActivity >= IDLE_THRESHOLD && !isIdleRef.current) {
      setIdle();
    }
  }, [setIdle]);

  /**
   * Track user activity (mouse/keyboard)
   */
  const handleUserActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
    
    // If was idle, mark as online
    if (isIdleRef.current) {
      setOnline();
    }
  }, [setOnline]);

  /**
   * Initialize presence system
   */
  useEffect(() => {
    if (!resolvedUserId || !resolvedUsername) {
      return;
    }

    if (!socketService.isConnected()) {
      console.warn('[Presence] Cannot initialize: socket not connected');
      return;
    }

    console.log('[Presence] Initializing for user:', user.username);

    // Initialize presence on server
    socketService.emit('presence:init', {
      userId: resolvedUserId,
      username: resolvedUsername,
    });

    // Listen for presence updates
    const handlePresenceUpdate = (data) => {
      console.log('[Presence] Update received:', data);
      
      setPresenceMap((prev) => ({
        ...prev,
        [data.userId]: {
          status: data.status,
          activity: data.activity,
          username: data.username,
          roomId: data.roomId,
        },
      }));
    };

    // Listen for presence snapshot (initial state)
    const handlePresenceSnapshot = (snapshot) => {
      console.log('[Presence] Snapshot received:', Object.keys(snapshot).length, 'users');
      setPresenceMap(snapshot);
    };

    socketService.socket?.on('presence:update', handlePresenceUpdate);
    socketService.socket?.on('presence:snapshot', handlePresenceSnapshot);

    // Start heartbeat interval
    heartbeatInterval.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    console.log('[Presence] Heartbeat started (30s interval)');

    // Start idle detection check
    idleTimer.current = setInterval(checkIdleStatus, 60000); // Check every minute
    
    // Track user activity for idle detection
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      console.log('[Presence] Cleaning up');
      
      // Clear intervals
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (idleTimer.current) {
        clearInterval(idleTimer.current);
      }

      // Remove event listeners
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);

      // Remove socket listeners
      socketService.socket?.off('presence:update', handlePresenceUpdate);
      socketService.socket?.off('presence:snapshot', handlePresenceSnapshot);

      setIsInitialized(false);
    };
  }, [resolvedUserId, resolvedUsername, sendHeartbeat, checkIdleStatus, handleUserActivity]);

  /**
   * Get presence for a specific user
   */
  const getUserPresence = useCallback((userId) => {
    return presenceMap[userId] || { status: 'offline', activity: null };
  }, [presenceMap]);

  /**
   * Check if a user is online
   */
  const isUserOnline = useCallback((userId) => {
    const presence = presenceMap[userId];
    return presence && presence.status !== 'offline';
  }, [presenceMap]);

  /**
   * Get status color for UI
   */
  const getStatusColor = useCallback((userId) => {
    const presence = presenceMap[userId];
    if (!presence) return 'gray';

    switch (presence.status) {
      case 'online':
        return 'green';
      case 'idle':
        return 'yellow';
      case 'dnd':
        return 'red';
      case 'offline':
      default:
        return 'gray';
    }
  }, [presenceMap]);

  /**
   * Get status emoji for UI
   */
  const getStatusEmoji = useCallback((userId) => {
    const presence = presenceMap[userId];
    if (!presence) return '⚫';

    switch (presence.status) {
      case 'online':
        return '🟢';
      case 'idle':
        return '🌙';
      case 'dnd':
        return '🔴';
      case 'offline':
      default:
        return '⚫';
    }
  }, [presenceMap]);

  return {
    // State
    presenceMap,
    isInitialized,
    
    // Functions
    updateStatus,
    updateActivity,
    setIdle,
    setOnline,
    getUserPresence,
    isUserOnline,
    getStatusColor,
    getStatusEmoji,
  };
};
