import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface User {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export interface TokenPayload extends JwtPayload {
  userId: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface RoadmapInput {
  goal: string;
  tags: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
}
