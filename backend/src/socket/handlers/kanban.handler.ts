import { Server, Socket } from 'socket.io';
import Room from '../../models/room.model';
import { updateMemberProgress } from '../../services/room.service';

export function registerKanbanHandlers(io: Server, socket: Socket): void {
  const userId = socket.data.userId;

  socket.on(
    'KANBAN_UPDATE',
    async ({
      roomId,
      taskId,
      newColumn,
    }: {
      roomId: string;
      taskId: string;
      newColumn: 'backlog' | 'todo' | 'inProgress' | 'done';
    }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const board = room.kanbanBoards.find(
          (b) => b.userId.toString() === userId
        );
        if (!board) return;

        const task = board.tasks.find((t) => t.taskId === taskId);
        if (!task) return;

        task.column = newColumn;
        if (newColumn === 'done') {
          task.completedAt = new Date();
        }

        await room.save();

        // Update progress
        const progressResult = await updateMemberProgress(
          roomId,
          userId,
          task.topicRef
        );

        // Sync kanban back to the user (multi-tab sync)
        socket.emit('KANBAN_SYNCED', { board });

        // Broadcast progress update to ALL in room
        io.to(roomId).emit('PROGRESS_UPDATE', {
          averageProgress: progressResult.averageProgress,
          memberProgress: progressResult.memberProgress,
          userId,
        });
      } catch (err) {
        console.error('[Socket] KANBAN_UPDATE error:', err);
      }
    }
  );
}
