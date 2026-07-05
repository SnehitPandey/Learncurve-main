import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.utils';
import User from '../models/user.model';
import { registerRoomHandlers } from './handlers/room.handler';
import { registerKanbanHandlers } from './handlers/kanban.handler';
import { registerPresenceHandlers } from './handlers/presence.handler';

let io: Server;

export function initSocketService(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware on handshake
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token;

      // Fallback: parse jwt_token from cookie header
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'jwt_token') {
            token = value;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] Connected: ${userId}`);

    // Set user online
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastActive: new Date(),
    });

    // Register all handlers
    registerRoomHandlers(io, socket);
    registerKanbanHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    // On disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${userId}`);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastActive: new Date(),
      });

      // Notify all rooms the user was in
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('USER_OFFLINE', { userId });
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
