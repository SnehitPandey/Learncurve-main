import { Router } from 'express';
import {
  completeFocusSession,
  getUserFocusSessions,
} from '../controllers/focus.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { focusSessionSchema } from '../validators/focus.validators';

const router = Router();

// POST /rooms/:roomId/focus — complete a focus session
router.post('/:roomId/focus', authenticateJWT, validate(focusSessionSchema), completeFocusSession);

// GET /rooms/:roomId/focus — get user's focus sessions
router.get('/:roomId/focus', authenticateJWT, getUserFocusSessions);

export default router;
