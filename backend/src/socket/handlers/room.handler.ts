import { Server, Socket } from 'socket.io';
import Room from '../../models/room.model';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId;

  socket.on('JOIN_ROOM', async ({ roomId }: { roomId: string }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return;

      const member = room.members.find(
        (m) => m.userId.toString() === userId
      );
      if (!member) return;

      // Auto-promote WAITING members
      if (member.joinStatus === 'WAITING') {
        console.log(`[Socket] Auto-promoting WAITING member ${userId} in room ${roomId}`);
        member.joinStatus = 'ACCEPTED';

        // Generate kanban tasks for newly accepted member
        const { generateTasksForUser } = await import('../../services/taskGenerator.service');
        let board = room.kanbanBoards.find((b) => b.userId.toString() === userId);
        if (!board) {
          const mongoose = (await import('mongoose')).default;
          room.kanbanBoards.push({ userId: new mongoose.Types.ObjectId(userId), tasks: [] } as any);
        }
        generateTasksForUser(room, userId);

        room.markModified('members');
        room.markModified('kanbanBoards');
        await room.save();
      }

      socket.join(roomId);

      // Emit back to this socket
      socket.emit('ROOM_JOINED', {
        roomId,
        averageProgress: room.averageProgress,
      });

      // Broadcast to others in the room
      socket.to(roomId).emit('USER_JOINED_ROOM', { userId });
    } catch (err) {
      console.error('[Socket] JOIN_ROOM error:', err);
    }
  });

  socket.on('LEAVE_ROOM', ({ roomId }: { roomId: string }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('USER_LEFT_ROOM', { userId });
  });

  socket.on(
    'SEND_MESSAGE',
    async ({ roomId, content }: { roomId: string; content: string }) => {
      try {
        if (!content || typeof content !== 'string') return;

        const room = await Room.findById(roomId);
        if (!room) return;

        const member = room.members.find(
          (m) => m.userId.toString() === userId
        );
        if (!member) return;

        // Auto-promote WAITING members so they can chat
        if (member.joinStatus === 'WAITING') {
          member.joinStatus = 'ACCEPTED';
          room.markModified('members');
        }

        // We need the sender's name — populate from the member or fetch
        const User = (await import('../../models/user.model')).default;
        const user = await User.findById(userId).select('name');
        const senderName = user?.name ?? 'Unknown';

        const message = {
          senderId: userId,
          senderName,
          content,
          type: 'text' as const,
          createdAt: new Date(),
        };

        room.chatMessages.push(message as any);
        await room.save();

        // Broadcast to ALL in the room (including sender for confirmation)
        io.to(roomId).emit('NEW_MESSAGE', message);
      } catch (err) {
        console.error('[Socket] SEND_MESSAGE error:', err);
      }
    }
  );
}
