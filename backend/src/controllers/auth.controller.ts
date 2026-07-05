import { Request, Response, NextFunction } from 'express';
import {
  issueTokens,
  storeRefreshToken,
  refreshAccessToken,
  logoutUser,
} from '../services/auth.service';
import User from '../models/user.model';

const IS_PROD = process.env.NODE_ENV === 'production';

function getClientRedirectUrl(req: Request): string {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL;
  }
  // In production consolidated hosting, redirect to the request origin
  if (IS_PROD) {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    return `${protocol}://${host}`;
  }
  return 'http://localhost:5173';
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  // sameSite configuration:
  // - Default to 'lax' for local development & consolidated production deployments.
  // - Allow overrides via COOKIE_SAME_SITE (e.g. 'none' if hosted on different domains).
  const sameSiteConfig = (IS_PROD && process.env.COOKIE_SAME_SITE)
    ? (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none')
    : 'lax';

  res.cookie('jwt_token', accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: sameSiteConfig,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: sameSiteConfig,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function googleCallback(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const user = req.user as Express.User;
    const clientRedirectUrl = getClientRedirectUrl(req);
    
    if (!user) {
      res.redirect(`${clientRedirectUrl}/login?error=auth_failed`);
      return;
    }

    const tokens = issueTokens(user._id);
    await storeRefreshToken(user._id, tokens.refreshToken);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.redirect(`${clientRedirectUrl}/login/callback`);
  } catch {
    const clientRedirectUrl = getClientRedirectUrl(req);
    res.redirect(`${clientRedirectUrl}/login?error=auth_failed`);
  }
}

export async function logout(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?._id;
    const refreshToken = req.cookies?.refresh_token;

    if (userId) {
      await logoutUser(userId, refreshToken);
    }

    res.clearCookie('jwt_token');
    res.clearCookie('refresh_token');
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

export async function refresh(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const incomingToken = req.cookies?.refresh_token;

    if (!incomingToken) {
      res.status(401).json({ success: false, message: 'No refresh token provided' });
      return;
    }

    const tokens = await refreshAccessToken(incomingToken);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({ success: true, message: 'Tokens refreshed' });
  } catch {
    res.clearCookie('jwt_token');
    res.clearCookie('refresh_token');
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
}

export async function getMe(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user?._id)
      .select('-googleId -refreshTokens -__v');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}
