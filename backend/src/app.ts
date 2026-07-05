import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import './config/passport';
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import quizRoutes from './routes/quiz.routes';
import focusRoutes from './routes/focus.routes';
import userRoutes from './routes/user.routes';
import aiRoutes from './routes/ai.routes';
import contentRoutes from './routes/content.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes — auth is applied PER-ROUTE inside each router file, NOT here
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/content', contentRoutes);
app.use('/rooms', roomRoutes);
app.use('/rooms', quizRoutes);
app.use('/rooms', focusRoutes);
app.use('/users', userRoutes);

// Backward-compatibility aliases for previous /api-prefixed clients
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', quizRoutes);
app.use('/api/rooms', focusRoutes);
app.use('/api/users', userRoutes);

// Serve React build static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));

  // Wildcard route to redirect all other requests to React's index.html
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/auth') ||
      req.path.startsWith('/ai') ||
      req.path.startsWith('/content') ||
      req.path.startsWith('/rooms') ||
      req.path.startsWith('/users') ||
      req.path.startsWith('/api')
    ) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler — must be last
app.use(errorMiddleware);

export default app;
