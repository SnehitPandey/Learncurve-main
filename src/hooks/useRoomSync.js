/**
 * useRoomSync Hook
 * Handles room state synchronization with backend and Socket.IO
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { roomService } from '../services/roomService';
import { socketService } from '../services/socketService';

export const useRoomSync = (roomId) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  /**
   * Fetch room data from backend
   */
  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const data = await roomService.getRoom(roomId);
      
      if (isMounted.current) {
        setRoom(data.room);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch room:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load room');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [roomId]);

  /**
   * Handle topic completion
   */
  const handleTopicComplete = useCallback(({ topicId, userId, timestamp }) => {
    if (!isMounted.current) return;
    
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;
      
      // Find and update the topic
      const updatedRoom = { ...prevRoom };
      
      // Update roadmap topics
      if (updatedRoom.roadmap?.phases) {
        updatedRoom.roadmap.phases = updatedRoom.roadmap.phases.map(phase => ({
          ...phase,
          milestones: phase.milestones.map(milestone => ({
            ...milestone,
            topics: milestone.topics.map(topic => {
              if (topic._id === topicId) {
                return {
                  ...topic,
                  completedBy: [...(topic.completedBy || []), userId],
                  status: 'completed'
                };
              }
              return topic;
            })
          }))
        }));
      }
      
      return updatedRoom;
    });
  }, []);

  /**
   * Handle progress update
   */
  const handleProgressUpdate = useCallback(({ userId, progress }) => {
    if (!isMounted.current) return;
    
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;
      
      const updatedRoom = { ...prevRoom };
      
      // Update progress array
      if (updatedRoom.progress) {
        const progressIndex = updatedRoom.progress.findIndex(
          p => p.userId === userId
        );
        
        if (progressIndex >= 0) {
          updatedRoom.progress[progressIndex] = {
            ...updatedRoom.progress[progressIndex],
            ...progress
          };
        } else {
          updatedRoom.progress.push({ userId, ...progress });
        }
      }
      
      return updatedRoom;
    });
  }, []);

  /**
   * Handle new message
   */
  const handleNewMessage = useCallback((message) => {
    if (!isMounted.current) return;
    
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;
      
      return {
        ...prevRoom,
        messages: [...(prevRoom.messages || []), message]
      };
    });
  }, []);

  /**
   * Handle quiz ready
   */
  const handleQuizReady = useCallback(({ quizId, questionsCount }) => {
    if (!isMounted.current) return;
    
    console.log('Quiz ready:', quizId, 'with', questionsCount, 'questions');
    
    // Optionally fetch updated quiz list
    fetchRoom();
  }, [fetchRoom]);

  /**
   * Handle kanban update
   */
  const handleKanbanUpdate = useCallback(({ userId, change }) => {
    if (!isMounted.current) return;
    
    console.log('Kanban updated by user:', userId, change);
    
    // Optionally fetch updated kanban state
    fetchRoom();
  }, [fetchRoom]);

  /**
   * Handle timer events
   */
  const handleTimerStart = useCallback(({ userId, sessionId, topicId }) => {
    if (!isMounted.current) return;
    
    console.log('Focus session started:', { userId, sessionId, topicId });
  }, []);

  const handleTimerStop = useCallback(({ userId, sessionId, elapsed }) => {
    if (!isMounted.current) return;
    
    console.log('Focus session stopped:', { userId, sessionId, elapsed });
  }, []);

  /**
   * Initialize room and socket listeners
   */
  useEffect(() => {
    isMounted.current = true;
    
    if (!roomId) return;

    // Fetch initial room data
    fetchRoom();

    // Join socket room
    socketService.emit('room:join', { roomId });

    // Subscribe to real-time events
    socketService.on('room:topic:complete', handleTopicComplete);
    socketService.on('room:progress:update', handleProgressUpdate);
    socketService.on('room:message:new', handleNewMessage);
    socketService.on('room:quiz:new', handleQuizReady);
    socketService.on('room:kanban:update', handleKanbanUpdate);
    socketService.on('timer:session:start', handleTimerStart);
    socketService.on('timer:session:stop', handleTimerStop);

    // Cleanup function
    return () => {
      isMounted.current = false;
      
      // Unsubscribe from socket events
      socketService.off('room:topic:complete', handleTopicComplete);
      socketService.off('room:progress:update', handleProgressUpdate);
      socketService.off('room:message:new', handleNewMessage);
      socketService.off('room:quiz:new', handleQuizReady);
      socketService.off('room:kanban:update', handleKanbanUpdate);
      socketService.off('timer:session:start', handleTimerStart);
      socketService.off('timer:session:stop', handleTimerStop);
      
      // Leave socket room
      socketService.emit('room:leave', { roomId });
    };
  }, [
    roomId,
    fetchRoom,
    handleTopicComplete,
    handleProgressUpdate,
    handleNewMessage,
    handleQuizReady,
    handleKanbanUpdate,
    handleTimerStart,
    handleTimerStop
  ]);

  /**
   * Optimistic update helper
   */
  const optimisticUpdate = useCallback((updateFn) => {
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;
      return updateFn(prevRoom);
    });
  }, []);

  /**
   * Sync with backend (manual refresh)
   */
  const syncRoom = useCallback(async () => {
    setSyncing(true);
    await fetchRoom();
    setSyncing(false);
  }, [fetchRoom]);

  return {
    room,
    loading,
    error,
    syncing,
    setRoom,
    optimisticUpdate,
    syncRoom,
    refetch: fetchRoom
  };
};
