import User from '../models/user.model';
import { NotFoundError, AppError } from '../utils/errors';
import { getIO } from '../socket/socket.service';

export async function sendPartnerInvite(fromUserId: string, toEmail: string) {
  if (!toEmail) throw new AppError('Email is required', 400);

  const fromUser = await User.findById(fromUserId);
  if (!fromUser) throw new NotFoundError('User not found');

  if (fromUser.partnerStatus === 'accepted') {
    throw new AppError('You already have a partner', 400);
  }

  const toUser = await User.findOne({ email: toEmail.toLowerCase() });
  if (!toUser) throw new NotFoundError('User with that email not found');

  if (toUser._id.toString() === fromUserId) {
    throw new AppError('Cannot invite yourself', 400);
  }

  if (toUser.partnerStatus !== 'none') {
    throw new AppError('That user already has a partner or pending invite', 400);
  }

  // Set pending on target
  toUser.partnerId = fromUser._id;
  toUser.partnerStatus = 'pending';
  await toUser.save();

  // Set pending on sender too so they can't double-invite
  fromUser.partnerId = toUser._id;
  fromUser.partnerStatus = 'pending';
  await fromUser.save();

  // Emit socket event if target is online
  try {
    const io = getIO();
    io.emit('PARTNER_INVITE', {
      to: toUser._id.toString(),
      from: {
        _id: fromUser._id,
        name: fromUser.name,
        email: fromUser.email,
        avatar: fromUser.avatar,
      },
    });
  } catch {
    // Socket not initialized — skip
  }

  return { message: 'Partner invite sent' };
}

export async function acceptPartnerInvite(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (user.partnerStatus !== 'pending') {
    throw new AppError('No pending partner invite', 400);
  }

  if (!user.partnerId) {
    throw new AppError('No partner reference found', 400);
  }

  const partner = await User.findById(user.partnerId);
  if (!partner) throw new NotFoundError('Partner user not found');

  // Accept both sides
  user.partnerStatus = 'accepted';
  partner.partnerId = user._id;
  partner.partnerStatus = 'accepted';

  await user.save();
  await partner.save();

  // Emit to both
  try {
    const io = getIO();
    io.emit('PARTNER_ACCEPTED', {
      users: [user._id.toString(), partner._id.toString()],
    });
  } catch {
    // Socket not initialized — skip
  }

  return { message: 'Partner invite accepted' };
}

export async function dissolvePartnership(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (!user.partnerId) {
    throw new AppError('No partner to dissolve', 400);
  }

  const partner = await User.findById(user.partnerId);

  // Clear user
  user.partnerId = undefined;
  user.partnerStatus = 'none';
  user.duoStreak = { count: 0 };
  await user.save();

  // Clear partner if exists
  if (partner) {
    partner.partnerId = undefined;
    partner.partnerStatus = 'none';
    partner.duoStreak = { count: 0 };
    await partner.save();
  }

  return { message: 'Partnership dissolved' };
}

export async function getPartnerInfo(userId: string) {
  const user = await User.findById(userId).populate(
    'partnerId',
    'name email avatar isOnline duoStreak focusStreak'
  );
  if (!user) throw new NotFoundError('User not found');

  return {
    partnerStatus: user.partnerStatus,
    partner: user.partnerId ?? null,
    duoStreak: user.duoStreak,
  };
}
