import cron from 'node-cron';
import { Server } from 'socket.io';
import User from '../models/user.model';

/**
 * Presence cron — runs every 60 seconds
 * Marks users as offline if their lastActive is older than 35 seconds
 * (missed heartbeat window). Emits USER_OFFLINE for each affected user.
 */
export function initPresenceCron(io: Server): void {
  cron.schedule('*/60 * * * * *', async () => {
    try {
      const threshold = new Date(Date.now() - 35_000); // 35 seconds ago

      const staleUsers = await User.find({
        isOnline: true,
        lastActive: { $lt: threshold },
      }).select('_id');

      if (staleUsers.length === 0) return;

      const staleIds = staleUsers.map((u) => u._id);

      await User.updateMany(
        { _id: { $in: staleIds } },
        { $set: { isOnline: false } }
      );

      // Emit USER_OFFLINE for each stale user
      for (const user of staleUsers) {
        io.emit('USER_OFFLINE', { userId: user._id.toString() });
      }

      console.log(`[Cron] Marked ${staleUsers.length} users offline.`);
    } catch (err) {
      console.error('[Cron] Presence check failed:', err);
    }
  });
}
