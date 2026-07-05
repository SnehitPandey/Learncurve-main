import User, { IUser } from '../models/user.model';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.utils';

export function issueTokens(userId: string): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  };
}

export async function storeRefreshToken(
  userId: string,
  refreshToken: string
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { token: refreshToken, createdAt: new Date() } },
  });
}

export async function refreshAccessToken(
  incomingRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify the token cryptographically
  const payload = verifyRefreshToken(incomingRefreshToken);

  // Check it exists in the user's stored tokens
  const user = await User.findOne({
    _id: payload.userId,
    'refreshTokens.token': incomingRefreshToken,
  });

  if (!user) {
    throw new Error('Refresh token not found or already used');
  }

  // Rotate: remove old, issue new
  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.token !== incomingRefreshToken
  );

  const tokens = issueTokens(user._id.toString());
  user.refreshTokens.push({ token: tokens.refreshToken, createdAt: new Date() });
  await user.save();

  return tokens;
}

export async function logoutUser(
  userId: string,
  refreshToken?: string
): Promise<void> {
  if (refreshToken) {
    // Remove just this token
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
  } else {
    // Clear all refresh tokens (full logout)
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });
  }
}

export async function cleanExpiredTokens(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await User.updateMany(
    {},
    { $pull: { refreshTokens: { createdAt: { $lt: sevenDaysAgo } } } }
  );
}
