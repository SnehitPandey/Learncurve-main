import { Router } from 'express';
import {
  generateQuizForUser,
  submitQuizAnswers,
  getQuiz,
} from '../controllers/quiz.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { submitAnswersSchema } from '../validators/quiz.validators';

const router = Router();

// POST /rooms/:roomId/quiz — generate a quiz
router.post('/:roomId/quiz', authenticateJWT, generateQuizForUser);

// Backward-compatible alias for previous clients
router.post('/:roomId/quiz/generate', authenticateJWT, generateQuizForUser);

// POST /rooms/:roomId/quiz/:quizId/submit — submit answers
router.post(
  '/:roomId/quiz/:quizId/submit',
  authenticateJWT,
  validate(submitAnswersSchema),
  submitQuizAnswers
);

// GET /rooms/:roomId/quiz/:quizId — get quiz (without correctIndex)
router.get('/:roomId/quiz/:quizId', authenticateJWT, getQuiz);

export default router;
