import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { roomService } from '../services/roomService';
import { apiClient } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || '';

/**
 * Custom hook for managing real-time user presence and activity
 * @param {string} userId - Current user ID
 * @param {string|null} partnerId - Partner user ID
 * @param {boolean} initialUserOnline - Initial online state for user
 * @param {Object} initialPartnerState - Initial state for partner {isOnline, studying, topicName}
 * @returns {Object} Presence state and methods
 */
export const usePresence = (userId, partnerId = null, initialUserOnline = true, initialPartnerState = null) => {
  const [userActivity, setUserActivity] = useState({
    isOnline: initialUserOnline,
    studying: null,
    topicName: null,
  });

  const [partnerActivity, setPartnerActivity] = useState({
    isOnline: initialPartnerState?.isOnline || false,
    studying: initialPartnerState?.studying || null,
    topicName: initialPartnerState?.topicName || null,
  });

  const socketRef = useRef(null);
  const hasInitialized = useRef(false); // ✅ Prevent React Strict Mode double initialization
  const reconnectTimeoutRef = useRef(null);
  const shareRedeemHandlersRef = useRef([]);
  const partnerConnectedHandlersRef = useRef([]);
  const partnerDisconnectHandlersRef = useRef([]);
  const partnerStatusDebounceRef = useRef(null);
  const lastPartnerStatusRef = useRef({ isOnline: false, timestamp: 0 });
  const hasLoggedAuthWarningRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    // Authentication is handled via HttpOnly cookies (withCredentials: true in socket options)
    
    // Wait for authenticated user before connecting
    if (!userId) {
      return;
    }
    
    // ✅ Prevent duplicate socket initialization (React Strict Mode protection)
    if (hasInitialized.current) {
      console.log('[PRESENCE] ⏭️ Socket already initialized, skipping (StrictMode safe)');
      return;
    }

    hasInitialized.current = true; // Mark as initialized BEFORE creating socket

    try {
      console.log('[PRESENCE] 🔌 Initializing socket connection for userId:', userId, '| partnerId:', partnerId);
      
      const socket = io(SOCKET_URL, {
        transports: ['websocket'], // ✅ WebSocket only - prevents "closed before established" errors
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        reconnectionDelayMax: 5000,
        timeout: 10000, // ✅ Connection timeout
        withCredentials: true, // ✅ CRITICAL: Allow credentials for CORS
        autoConnect: true,
      });

      socketRef.current = socket;

      // Expose socket to window for debugging (development only)
      if (import.meta.env.DEV) {
        window.__socket = socket;
      }
      
      socket.on('connect', () => {
        console.log('[PRESENCE] ✅ Connected:', socket.id, '| userId:', userId, '| partnerId:', partnerId || 'none');
        
        // Mark user as online
        setUserActivity(prev => ({ ...prev, isOnline: true }));
        
        // 🔄 Initialize presence on server with TWO-WAY HANDSHAKE
        socket.emit('presence:init', {
          userId,
          ...(partnerId ? { partnerId } : {}),
        });
        console.log('[PRESENCE] 📤 Emitted presence:init');
      });

      // ✅ Handle connection errors
      socket.on('connect_error', (error) => {
        const isAuthIssue = typeof error?.message === 'string' && error.message.toLowerCase().includes('unauthorized');
        if (isAuthIssue) {
          if (!hasLoggedAuthWarningRef.current) {
            console.warn('[PRESENCE] Socket auth pending; realtime presence will connect after login.');
            hasLoggedAuthWarningRef.current = true;
          }
          return;
        }

        console.warn('[PRESENCE] ⚠️ Connection error:', error.message);
        // Don't reset hasInitialized - let reconnection handle it
      });
  hasLoggedAuthWarningRef.current = false;

      // ✅ Handle reconnection attempts
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 [PRESENCE] Reconnection attempt #${attemptNumber}`);
      });

      // ✅ Handle successful reconnection
      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ [PRESENCE] Reconnected after ${attemptNumber} attempts`);
        // Re-initialize presence after reconnection
        socket.emit('presence:init', {
          userId,
          ...(partnerId ? { partnerId } : {}),
        });
        console.log('[PRESENCE] 📤 Re-emitted presence:init after reconnect');
      });

      socket.on('disconnect', (reason) => {
        console.log('[PRESENCE] 🔴 Disconnected:', reason);
        setUserActivity(prev => ({ ...prev, isOnline: false }));
        
        // If disconnected by server, manually reconnect
        if (reason === 'io server disconnect') {
          console.log('[PRESENCE] 🔄 Server initiated disconnect, reconnecting...');
          socket.connect();
        }
      });

      // ✅ Handle socket errors
      socket.on('error', (error) => {
        console.error('❌ [PRESENCE] Socket error:', error);
      });

      // Listen for activity updates from other users
      socket.on('activityUpdate', (data) => {
        // Update partner activity if it's the partner's update
        if (partnerId && data.userId === partnerId) {
          setPartnerActivity({
            isOnline: data.isOnline,
            studying: data.studying,
            topicName: data.topicName,
          });
        }
      });

      // Listen for presence updates (online/offline status)
      socket.on('presenceUpdate', (data) => {
        try {
          const { userId: updatedUserId, isOnline } = data;
          
          // Update user activity if it's for current user
          if (userId && updatedUserId === userId) {
            setUserActivity(prev => ({
              ...prev,
              isOnline: isOnline,
            }));
          }
          
          // Update partner activity if it's for partner
          if (partnerId && updatedUserId === partnerId) {
            setPartnerActivity(prev => ({
              ...prev,
              isOnline: isOnline,
            }));
          }
        } catch (err) {
          console.error('Error handling presenceUpdate', err);
        }
      });

      // 🔄 Listen for presence:update events (TWO-WAY HANDSHAKE)
      // This is the primary event for partner presence updates
      socket.on('presence:update', (payload) => {
        try {
          const { updatedUserId, isOnline, activity } = payload;
          
          console.log('[PRESENCE] 📥 Received presence:update:', {
            updatedUserId,
            isOnline,
            myId: userId,
            partnerId,
            activity: activity?.type
          });
          
          // ✅ Ignore updates about ourselves (server shouldn't send these)
          if (updatedUserId === userId) {
            console.log('[PRESENCE] ⏭️ Ignoring self-update');
            return;
          }
          
          // ✅ Only process updates for our current partner
          if (updatedUserId !== partnerId) {
            console.log('[PRESENCE] ℹ️ Update not for current partner, ignoring');
            return;
          }
          
          // ✅ Update partner activity
          const newStudying = activity?.type === 'studying' ? (activity.topic || 'Unknown') : null;
          const newTopicName = activity?.type === 'studying' ? activity.topic : null;
          
          setPartnerActivity((prev) => {
            // Prevent unnecessary re-renders if nothing changed
            if (prev.isOnline === isOnline && prev.studying === newStudying && prev.topicName === newTopicName) {
              return prev;
            }
            
            console.log('[PRESENCE] 👥 Partner status updated:', { isOnline, studying: newStudying });
            
            return {
              isOnline,
              studying: newStudying,
              topicName: newTopicName,
            };
          });
        } catch (err) {
          console.error('❌ [PRESENCE] Error handling presence:update:', err);
        }
      });

      // Listen for statusUpdate events (partner-specific presence & activity updates) - LEGACY
      socket.on('statusUpdate', (data) => {
        try {
          const { updatedUserId, isOnline, studying, topicName } = data;
          
          // ✅ Ignore updates about ourselves
          if (updatedUserId === userId) {
            return;
          }
          
          // Update partner activity with full status info
          if (partnerId && updatedUserId === partnerId) {
            setPartnerActivity({
              isOnline: isOnline,
              studying: studying,
              topicName: topicName,
            });
          }
        } catch (err) {
          console.error('Error handling statusUpdate', err);
        }
      });

      // Listen for partner connected events (NEW - primary event)
      socket.on('partnerConnected', (partner) => {
        try {
          // Call any registered handlers
          partnerConnectedHandlersRef.current.forEach((h) => {
            try { h(partner); } catch (e) { console.error('partnerConnected handler error', e); }
          });
        } catch (err) {
          console.error('Error handling partnerConnected', err);
        }
      });

      // Listen for share link redeem events (LEGACY - for backward compatibility)
      socket.on('shareLinkRedeemed', (data) => {
        try {
          // Call any registered handlers
          shareRedeemHandlersRef.current.forEach((h) => {
            try { h(data); } catch (e) { console.error('shareRedeem handler error', e); }
          });
        } catch (err) {
          console.error('Error handling shareLinkRedeemed', err);
        }
      });

      // Listen for partner disconnect events
      socket.on('partnerDisconnected', () => {
        try {
          // Call any registered handlers
          partnerDisconnectHandlersRef.current.forEach((h) => {
            try { h(); } catch (e) { console.error('partnerDisconnect handler error', e); }
          });
        } catch (err) {
          console.error('Error handling partnerDisconnected', err);
        }
      });

      // Listen for duo:update events (connection removal sync)
      socket.on('duo:update', (data) => {
        try {
          if (data.removed) {
            // Call disconnect handlers to clear partner UI
            partnerDisconnectHandlersRef.current.forEach((h) => {
              try { h(); } catch (e) { console.error('duo:update disconnect handler error', e); }
            });
          }
        } catch (err) {
          console.error('Error handling duo:update', err);
        }
      });

      return () => {
        // ✅ CRITICAL: Only disconnect in production to prevent React Strict Mode issues
        // In dev mode, Strict Mode causes useEffect to run twice (mount → unmount → remount)
        // Skipping cleanup in dev keeps the socket alive through remount
        if (import.meta.env.MODE === 'production') {
          console.log('[PRESENCE] 🧹 Cleaning up socket (production mode)');
          
          if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
          }
          
          hasInitialized.current = false;
        } else {
          console.log('[PRESENCE] 🚫 Skipping cleanup in dev mode (StrictMode safe)');
        }
        
        // Always clear timers regardless of mode
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        if (partnerStatusDebounceRef.current) {
          clearTimeout(partnerStatusDebounceRef.current);
          partnerStatusDebounceRef.current = null;
        }
      };
    } catch (error) {
      console.error('❌ [PRESENCE] Failed to initialize socket:', error);
      hasInitialized.current = false; // Allow retry on error
    }
  }, [userId, partnerId]);

  // Fetch initial activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;

      const userIds = partnerId ? [userId, partnerId] : [userId];

      try {
        const response = await roomService.getUsersActivities(userIds);
        
        if (response.success && response.activities) {
          // Update user activity
          if (response.activities[userId]) {
            setUserActivity({
              isOnline: response.activities[userId].isOnline,
              studying: response.activities[userId].studying,
              topicName: response.activities[userId].topicName,
            });
          }

          // Update partner activity
          if (partnerId && response.activities[partnerId]) {
            setPartnerActivity({
              isOnline: response.activities[partnerId].isOnline,
              studying: response.activities[partnerId].studying,
              topicName: response.activities[partnerId].topicName,
            });
          }
        }
      } catch (error) {
        // Ignore: activity endpoint may be unavailable in lightweight backend mode.
      }
    };

    fetchActivities();
    
    // Poll for updates every 30 seconds as fallback
    const interval = setInterval(fetchActivities, 30000);
    
    return () => clearInterval(interval);
  }, [userId, partnerId]);

  // Update current user's activity
  const updateActivity = useCallback(async (studying, topicName) => {
    if (!socketRef.current || !userId) return;

    try {
      // Update via API
      await roomService.updateActivity({ studying, topicName });

      // Emit socket event for real-time update
      socketRef.current.emit('updateActivity', { studying, topicName });

      // Update local state
      setUserActivity(prev => ({
        ...prev,
        studying,
        topicName,
      }));
    } catch (error) {
      // Non-critical; keep local state/socket flow alive.
    }
  }, [userId]);

  // Set user as idle
  const setIdle = useCallback(() => {
    updateActivity(null, null);
  }, [updateActivity]);

  /**
   * Update user's activity (studying/idle) - NEW standardized method
   * @param {Object} activity - { type: 'studying' | 'idle', topic?: string }
   */
  const updateUserActivity = useCallback((activity) => {
    if (socketRef.current && userId) {
      socketRef.current.emit('presence:updateActivity', {
        userId,
        activity,
      });
      
      // Update local state immediately for responsiveness
      setUserActivity(prev => ({
        ...prev,
        studying: activity.type === 'studying' ? (activity.topic || 'Unknown') : null,
        topicName: activity.type === 'studying' ? activity.topic : null,
      }));
    }
  }, [userId]);

  return {
    userActivity,
    partnerActivity,
    updateActivity,
    setIdle,
    updateUserActivity,
    isConnected: socketRef.current?.connected || false,
    // Subscribe to partner connected events (PRIMARY)
    subscribeToPartnerConnected: (handler) => {
      partnerConnectedHandlersRef.current.push(handler);
      return () => {
        const idx = partnerConnectedHandlersRef.current.indexOf(handler);
        if (idx > -1) partnerConnectedHandlersRef.current.splice(idx, 1);
      };
    },
    // Subscribe to share link redeemed events (LEGACY)
    subscribeToShareRedeem: (handler) => {
      shareRedeemHandlersRef.current.push(handler);
      return () => {
        const idx = shareRedeemHandlersRef.current.indexOf(handler);
        if (idx > -1) shareRedeemHandlersRef.current.splice(idx, 1);
      };
    },
    // Subscribe to partner disconnected events
    subscribeToPartnerDisconnect: (handler) => {
      partnerDisconnectHandlersRef.current.push(handler);
      return () => {
        const idx = partnerDisconnectHandlersRef.current.indexOf(handler);
        if (idx > -1) partnerDisconnectHandlersRef.current.splice(idx, 1);
      };
    }
  };
};
