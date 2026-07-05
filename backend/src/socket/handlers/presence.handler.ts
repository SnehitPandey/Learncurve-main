import { Server, Socket } from 'socket.io';
import User from '../../models/user.model';

export function registerPresenceHandlers(_io: Server, socket: Socket): void {
  const userId = socket.data.userId;

  socket.on('PING', async () => {
    try {
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });
      socket.emit('PONG');
    } catch (err) {
      console.error('[Socket] PING error:', err);
    }
  });
}
