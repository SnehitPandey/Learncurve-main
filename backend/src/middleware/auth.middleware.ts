import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import User from '../models/user.model';

export async function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Try Authorization header first, then cookie
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.jwt_token) {
      token = req.cookies.jwt_token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).select('_id name email avatar');

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
