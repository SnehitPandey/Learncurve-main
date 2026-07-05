import { Router } from 'express';
import passport from 'passport';
import { googleCallback, logout, refresh, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google' }),
  googleCallback
);

// Refresh tokens
router.post('/refresh', refresh);

// Logout (requires auth)
router.post('/logout', authenticateJWT, logout);

// Get current user (requires auth)
router.get('/me', authenticateJWT, getMe);

export default router;
