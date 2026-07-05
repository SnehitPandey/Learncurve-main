import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { generateContent } from '../controllers/content.controller';

const router = Router();

// POST /content/generate
router.post('/generate', authenticateJWT, generateContent);

export default router;
