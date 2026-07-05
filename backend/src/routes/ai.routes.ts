import { Router } from 'express';
import {
	generateRoadmap,
	generateQuiz,
	generateRoomSummary,
	generateText,
} from '../controllers/ai.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// POST /ai/roadmap — generate roadmap preview
router.post('/roadmap', authenticateJWT, generateRoadmap);

// POST /ai/quiz — generate quiz questions
router.post('/quiz', authenticateJWT, generateQuiz);

// POST /ai/room-summary — generate room planning summary
router.post('/room-summary', authenticateJWT, generateRoomSummary);

// POST /ai/text — generate short assistant response
router.post('/text', authenticateJWT, generateText);

export default router;
