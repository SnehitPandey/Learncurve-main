import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initSocketService } from './socket/socket.service';
import { initStreakCron } from './crons/streak.cron';
import { initPresenceCron } from './crons/presence.cron';
import { initTaskRegenCron } from './crons/taskRegen.cron';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

connectDB().then(() => {
  const io = initSocketService(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });

  // Start cron jobs
  initStreakCron();
  initPresenceCron(io);
  initTaskRegenCron();
  console.log('[Crons] Streak, presence, and task-regen crons started');
});

export { httpServer };
