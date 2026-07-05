import cron from 'node-cron';
import User from '../models/user.model';
import Room from '../models/room.model';
import { cleanExpiredTokens } from '../services/auth.service';

/**
 * Streak cron — runs every day at 00:05 AM
 * 1. Check duo streaks for partner pairs
 * 2. Check individual focus streaks
 * 3. Clean expired refresh tokens
 */
export function initStreakCron(): void {
  cron.schedule('5 0 * * *', async () => {
    console.log('[Cron] Running daily streak check...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

      // ─── 1. Duo Streaks ────────────────────────────────────────────────
      const partners = await User.find({ partnerStatus: 'accepted', partnerId: { $ne: null } });

      // Track processed pairs to avoid double-counting
      const processedPairs = new Set<string>();
      const bulkOps: any[] = [];

      for (const user of partners) {
        const partnerId = user.partnerId!.toString();
        const pairKey = [user._id.toString(), partnerId].sort().join('-');

        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const partner = partners.find((p) => p._id.toString() === partnerId);
        if (!partner) continue;

        // Check if both have at least one focus session yesterday
        const userSession = await Room.findOne({
          'focusSessions.userId': user._id,
          'focusSessions.completedAt': { $gte: startOfYesterday, $lte: endOfYesterday },
        });

        const partnerSession = await Room.findOne({
          'focusSessions.userId': partner._id,
          'focusSessions.completedAt': { $gte: startOfYesterday, $lte: endOfYesterday },
        });

        if (userSession && partnerSession) {
          // Both studied — increment duo streak
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: {
                $inc: { 'duoStreak.count': 1 },
                $set: { 'duoStreak.lastUpdated': new Date() },
              },
            },
          });
          bulkOps.push({
            updateOne: {
              filter: { _id: partner._id },
              update: {
                $inc: { 'duoStreak.count': 1 },
                $set: { 'duoStreak.lastUpdated': new Date() },
              },
            },
          });
        } else {
          // At least one didn't study — reset duo streak
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { 'duoStreak.count': 0, 'duoStreak.lastUpdated': new Date() } },
            },
          });
          bulkOps.push({
            updateOne: {
              filter: { _id: partner._id },
              update: { $set: { 'duoStreak.count': 0, 'duoStreak.lastUpdated': new Date() } },
            },
          });
        }
      }

      // ─── 2. Individual Focus Streaks ──────────────────────────────────
      const allUsers = await User.find({}).select('_id');

      for (const user of allUsers) {
        const hadSession = await Room.findOne({
          'focusSessions.userId': user._id,
          'focusSessions.completedAt': { $gte: startOfYesterday, $lte: endOfYesterday },
        });

        if (hadSession) {
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: {
                $inc: { 'focusStreak.count': 1 },
                $set: { 'focusStreak.lastUpdated': new Date() },
              },
            },
          });
        } else {
          bulkOps.push({
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { 'focusStreak.count': 0, 'focusStreak.lastUpdated': new Date() } },
            },
          });
        }
      }

      // ─── 3. Execute bulk write ────────────────────────────────────────
      if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps);
      }

      // ─── 4. Clean expired refresh tokens ──────────────────────────────
      await cleanExpiredTokens();

      console.log(`[Cron] Streak check complete. ${bulkOps.length} operations.`);
    } catch (err) {
      console.error('[Cron] Streak check failed:', err);
    }
  });
}
