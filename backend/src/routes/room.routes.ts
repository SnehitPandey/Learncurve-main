import { Router } from 'express';
import {
  createRoom,
  getRoomById,
  getUserRooms,
  getPublicRooms,
  joinRoom,
  leaveRoom,
  completeMilestoneTopic,
  getRoomMessages,
  postRoomMessage,
  getRoomMessageStats,
  getRoomQuizzes,
  getKanbanBoard,
  moveKanbanTask,
  acceptMember,
  completeRoom,
  regenerateTasks,
  checkRoomLimit,
} from '../controllers/room.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRoomSchema } from '../validators/room.validators';

const router = Router();

// GET /rooms/check-limit — check how many rooms the user has
router.get('/check-limit', authenticateJWT, checkRoomLimit);

// POST /rooms — create a new room
router.post('/', authenticateJWT, validate(createRoomSchema), createRoom);

// GET /rooms — get all rooms for current user
router.get('/', authenticateJWT, getUserRooms);

// GET /rooms/public — get active public rooms
router.get('/public', getPublicRooms);

// POST /rooms/join — join a room by code
router.post('/join', authenticateJWT, joinRoom);

// POST /rooms/:roomId/leave — leave a room
router.post('/:roomId/leave', authenticateJWT, leaveRoom);

// PATCH /rooms/:roomId/milestone/:milestoneId/topic/:topicIndex/complete — complete a milestone topic
router.patch('/:roomId/milestone/:milestoneId/topic/:topicIndex/complete', authenticateJWT, completeMilestoneTopic);

// GET /rooms/:roomId/messages — list room messages
router.get('/:roomId/messages', authenticateJWT, getRoomMessages);

// POST /rooms/:roomId/messages — post a room message
router.post('/:roomId/messages', authenticateJWT, postRoomMessage);

// GET /rooms/:roomId/stats — chat-related room stats
router.get('/:roomId/stats', authenticateJWT, getRoomMessageStats);

// GET /rooms/:roomId/quizzes — list quizzes for room
router.get('/:roomId/quizzes', authenticateJWT, getRoomQuizzes);

// GET /rooms/:roomId/kanban/:userId — user kanban board
router.get('/:roomId/kanban/:userId', authenticateJWT, getKanbanBoard);

// PATCH /rooms/:roomId/kanban/:userId/move — move kanban task
router.patch('/:roomId/kanban/:userId/move', authenticateJWT, moveKanbanTask);

// GET /rooms/:roomId — get a single room
router.get('/:roomId', authenticateJWT, getRoomById);

// PATCH /rooms/:roomId/accept/:userId — host accepts a member
router.patch('/:roomId/accept/:userId', authenticateJWT, acceptMember);

// PATCH /rooms/:roomId/complete — host marks room as completed
router.patch('/:roomId/complete', authenticateJWT, completeRoom);

// POST /rooms/:roomId/tasks/regenerate — host triggers task regeneration
router.post('/:roomId/tasks/regenerate', authenticateJWT, regenerateTasks);

export default router;
