/**
 * useFocusTimer Hook
 * Manages focus timer with persistence, auto-save, and backend sync
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { roomService } from '../services/roomService';

const STORAGE_KEY = 'focusTimer_';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

export const useFocusTimer = (roomId, userId) => {
  const [timerState, setTimerState] = useState({
    isRunning: false,
    elapsedSeconds: 0,
    progress: 0,
    task: null,
    milestone: null,
    sessionId: null,
  });

  const intervalRef = useRef(null);
  const autoSaveRef = useRef(null);
  const lastSaveTime = useRef(0);

  // Generate storage key for this room
  const getStorageKey = useCallback(() => {
    return `${STORAGE_KEY}${roomId}`;
  }, [roomId]);

  /**
   * Save timer state to localStorage
   */
  const saveToLocalStorage = useCallback((state) => {
    if (!roomId) return;
    
    try {
      const dataToSave = {
        ...state,
        savedAt: Date.now(),
      };
      localStorage.setItem(getStorageKey(), JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save timer to localStorage:', error);
    }
  }, [roomId, getStorageKey]);

  /**
   * Load timer state from localStorage
   */
  const loadFromLocalStorage = useCallback(() => {
    if (!roomId) return null;
    
    try {
      const saved = localStorage.getItem(getStorageKey());
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      
      // Check if saved state is recent (within 24 hours)
      const savedAt = parsed.savedAt || 0;
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (now - savedAt > maxAge) {
        // Too old, clear it
        localStorage.removeItem(getStorageKey());
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load timer from localStorage:', error);
      return null;
    }
  }, [roomId, getStorageKey]);

  /**
   * Clear localStorage for this room
   */
  const clearLocalStorage = useCallback(() => {
    if (!roomId) return;
    localStorage.removeItem(getStorageKey());
  }, [roomId, getStorageKey]);

  /**
   * Auto-save timer state to backend every 5 seconds
   */
  const autoSave = useCallback(async () => {
    if (!roomId || !timerState.sessionId || !timerState.isRunning) return;

    const now = Date.now();
    if (now - lastSaveTime.current < AUTO_SAVE_INTERVAL) return;

    try {
      await roomService.pulseFocusSession(
        roomId,
        timerState.sessionId,
        timerState.elapsedSeconds
      );
      lastSaveTime.current = now;
      
      // Also save to localStorage
      saveToLocalStorage(timerState);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [roomId, timerState, saveToLocalStorage]);

  /**
   * Start a new focus session
   */
  const startSession = useCallback(async (task, milestone) => {
    if (!roomId || !userId) return;

    try {
      // Start session on backend
      const response = await roomService.startFocusSession(
        roomId,
        task.id,
        task.title
      );

      const newState = {
        isRunning: true,
        elapsedSeconds: 0,
        progress: 0,
        task,
        milestone,
        sessionId: response.sessionId || `session_${Date.now()}`,
      };

      setTimerState(newState);
      saveToLocalStorage(newState);
      lastSaveTime.current = Date.now();
    } catch (error) {
      console.error('Failed to start focus session:', error);
      
      // Fallback: start locally without backend
      const newState = {
        isRunning: true,
        elapsedSeconds: 0,
        progress: 0,
        task,
        milestone,
        sessionId: `local_${Date.now()}`,
      };
      setTimerState(newState);
      saveToLocalStorage(newState);
    }
  }, [roomId, userId, saveToLocalStorage]);

  /**
   * Stop the timer
   */
  const stopSession = useCallback(async () => {
    if (!timerState.sessionId) return;

    try {
      // End session on backend (non-critical - ignore errors)
      if (roomId && timerState.sessionId) {
        try {
          await roomService.endFocusSession(roomId, timerState.sessionId);
        } catch (sessionError) {
          // Session might not exist in backend - that's okay, just log it
          console.warn('⚠️ Could not end focus session on backend (non-critical):', sessionError.message);
        }
      }
    } catch (error) {
      console.error('Failed to end focus session:', error);
    } finally {
      setTimerState({
        isRunning: false,
        elapsedSeconds: 0,
        progress: 0,
        task: null,
        milestone: null,
        sessionId: null,
      });
      clearLocalStorage();
    }
  }, [roomId, timerState.sessionId, clearLocalStorage]);

  /**
   * Pause the timer
   */
  const pauseSession = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
    }));
    saveToLocalStorage({
      ...timerState,
      isRunning: false,
    });
  }, [timerState, saveToLocalStorage]);

  /**
   * Resume the timer
   */
  const resumeSession = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
    }));
    saveToLocalStorage({
      ...timerState,
      isRunning: true,
    });
  }, [timerState, saveToLocalStorage]);

  /**
   * Update timer progress
   */
  const updateProgress = useCallback((newProgress) => {
    setTimerState(prev => ({
      ...prev,
      progress: newProgress,
    }));
  }, []);

  /**
   * Restore session from localStorage on mount - DISABLED
   * Auto-recovery disabled per user request - no popups
   * 
   * NEW: Load active session from backend on mount (cross-device sync)
   */
  useEffect(() => {
    if (!roomId || !userId) return;

    const loadActiveSession = async () => {
      try {
        const response = await roomService.getActiveFocusSession(roomId);
        
        if (response && response.session) {
          const session = response.session;
          
          // Check if session is recent (last pulse < 30 minutes ago)
          const lastPulse = new Date(session.lastPulseAt);
          const now = new Date();
          const minutesSinceLastPulse = (now - lastPulse) / (1000 * 60);
          
          if (minutesSinceLastPulse < 30 && session.isRunning) {
            // Resume active session
            console.log('🔄 Resuming active focus session from another device:', session);
            
            setTimerState({
              isRunning: true,
              elapsedSeconds: session.elapsedTime || 0,
              progress: 0,
              task: { id: session.topicId, title: session.topicTitle },
              milestone: session.milestoneId ? { id: session.milestoneId } : null,
              sessionId: session._id,
            });
          }
        } else {
          // No active session - clear local storage
          clearLocalStorage();
        }
      } catch (error) {
        console.warn('Could not load active session (non-critical):', error);
        // Silently fail - not critical for app functionality
      }
    };

    loadActiveSession();
  }, [roomId, userId, clearLocalStorage]);

  /**
   * Timer tick (every second)
   */
  useEffect(() => {
    if (!timerState.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimerState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning]);

  /**
   * Auto-save every 5 seconds
   */
  useEffect(() => {
    if (!timerState.isRunning) {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
        autoSaveRef.current = null;
      }
      return;
    }

    autoSaveRef.current = setInterval(() => {
      autoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [timerState.isRunning, autoSave]);

  /**
   * Save to localStorage when timer state changes
   */
  useEffect(() => {
    if (timerState.sessionId) {
      saveToLocalStorage(timerState);
    }
  }, [timerState, saveToLocalStorage]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  return {
    timerState,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    updateProgress,
    setTimerState,
  };
};
