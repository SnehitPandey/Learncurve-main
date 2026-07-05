import cron from 'node-cron';
import Room from '../models/room.model';
import { generateTasksForUser } from '../services/taskGenerator.service';

export function initTaskRegenCron(): void {
  // Run every day at 06:00 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('[TaskRegen] Starting daily task regeneration...');

    try {
      const rooms = await Room.find({ status: 'active' });

      for (const room of rooms) {
        try {
          const accepted = room.members.filter(
            (m) => m.joinStatus === 'ACCEPTED'
          );
          for (const member of accepted) {
            generateTasksForUser(room, member.userId);
          }
          await room.save();
        } catch (err) {
          console.error(`[TaskRegen] Room ${room._id} failed:`, err);
          // Continue — don't let one failure stop the cron
        }
      }

      console.log(`[TaskRegen] Done. ${rooms.length} rooms processed.`);
    } catch (err) {
      console.error('[TaskRegen] Fatal error:', err);
    }
  });
}
