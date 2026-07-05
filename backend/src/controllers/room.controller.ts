import { Request, Response, NextFunction } from 'express';
import * as roomService from '../services/room.service';
import { regenerateDailyTasks } from '../services/taskGenerator.service';
import Room from '../models/room.model';
import { sendSuccess, sendError } from '../utils/response.utils';

export async function createRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const MAX_ROOMS_PER_USER = 5;
    
    // Check how many rooms this user has already created (as host)
    const existingRoomCount = await Room.countDocuments({ hostId: req.user!._id });
    if (existingRoomCount >= MAX_ROOMS_PER_USER) {
      sendError(res, `You have reached the maximum limit of ${MAX_ROOMS_PER_USER} rooms. Please delete an existing room before creating a new one.`, 403);
      return;
    }

    const room = await roomService.createRoom(req.user!._id, req.body);
    sendSuccess(res, room, 'Room created', 201);
  } catch (err) {
    next(err);
  }
}

export async function checkRoomLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const MAX_ROOMS_PER_USER = 5;
    const existingRoomCount = await Room.countDocuments({ hostId: req.user!._id });
    
    sendSuccess(res, {
      currentRooms: existingRoomCount,
      maxRooms: MAX_ROOMS_PER_USER,
      canCreate: existingRoomCount < MAX_ROOMS_PER_USER,
      remainingSlots: Math.max(0, MAX_ROOMS_PER_USER - existingRoomCount)
    });
  } catch (err) {
    next(err);
  }
}

export async function getRoomById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    sendSuccess(res, room);
  } catch (err) {
    next(err);
  }
}

export async function getUserRooms(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rooms = await roomService.getUserRooms(req.user!._id);
    sendSuccess(res, rooms);
  } catch (err) {
    next(err);
  }
}

export async function getPublicRooms(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rooms = await roomService.getPublicRooms();
    sendSuccess(res, rooms);
  } catch (err) {
    next(err);
  }
}

export async function joinRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.body;
    if (!code) {
      sendError(res, 'Room code is required', 400);
      return;
    }
    const room = await roomService.joinRoom(req.user!._id, code);
    sendSuccess(res, room, 'Join request sent');
  } catch (err) {
    next(err);
  }
}

export async function leaveRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await roomService.leaveRoom(req.params.roomId, req.user!._id);
    sendSuccess(res, null, 'Left room successfully');
  } catch (err) {
    next(err);
  }
}

export async function completeMilestoneTopic(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topicIndex = Number(req.params.topicIndex);
    if (Number.isNaN(topicIndex) || topicIndex < 0) {
      sendError(res, 'Invalid topic index', 400);
      return;
    }

    const result = await roomService.completeMilestoneTopic(
      req.params.roomId,
      req.user!._id,
      req.params.milestoneId,
      topicIndex
    );

    sendSuccess(res, result, 'Topic marked complete');
  } catch (err) {
    next(err);
  }
}

export async function acceptMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.acceptMember(
      req.params.roomId,
      req.user!._id,
      req.params.userId
    );
    sendSuccess(res, room, 'Member accepted');
  } catch (err) {
    next(err);
  }
}

export async function completeRoom(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.completeRoom(req.params.roomId, req.user!._id);
    sendSuccess(res, room, 'Room completed');
  } catch (err) {
    next(err);
  }
}

export async function regenerateTasks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      sendError(res, 'Room not found', 404);
      return;
    }
    
    // Find the member record for this user
    const member = room.members.find(
      (m) => m.userId.toString() === req.user!._id || (m.userId as any)?._id?.toString() === req.user!._id
    );
    
    if (!member) {
      sendError(res, 'You are not a member of this room', 403);
      return;
    }

    // Auto-promote WAITING members (covers users who joined before the auto-accept fix)
    if (member.joinStatus === 'WAITING') {
      console.log(`[Regen] Auto-promoting WAITING member ${req.user!._id} to ACCEPTED`);
      member.joinStatus = 'ACCEPTED';
      // Generate tasks for this newly promoted member
      const { generateTasksForUser } = await import('../services/taskGenerator.service');
      generateTasksForUser(room, req.user!._id);
      room.markModified('members');
      room.markModified('kanbanBoards');
      await room.save();
    }

    const updated = await regenerateDailyTasks(room);
    
    // Debug: confirm tasks survived the save
    console.log('[Regen] Tasks after save:', 
      updated.kanbanBoards.map((b: any) => ({ userId: b.userId.toString(), taskCount: b.tasks.length }))
    );
    
    // Return the requesting user's board so the frontend can render it
    const userId = req.user!._id;
    const board = updated.kanbanBoards.find((b) => b.userId.toString() === userId.toString());
    
    console.log('[Regen] Returning board tasks:', board?.tasks?.length ?? 0);
    
    const kanban = {
      backlog: (board?.tasks ?? []).filter((t) => t.column === 'backlog'),
      todo: (board?.tasks ?? []).filter((t) => t.column === 'todo'),
      inProgress: (board?.tasks ?? []).filter((t) => t.column === 'inProgress'),
      done: (board?.tasks ?? []).filter((t) => t.column === 'done'),
    };
    
    sendSuccess(res, { kanban, tasks: board?.tasks ?? [] }, 'Tasks regenerated');
  } catch (err) {
    next(err);
  }
}

export async function getRoomMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

    const sorted = [...(room.chatMessages || [])].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return order === 'asc' ? aTime - bTime : bTime - aTime;
    });

    const items = sorted.slice(0, limit).map((msg, index) => ({
      _id: `${req.params.roomId}-${index}-${new Date(msg.createdAt).getTime()}`,
      content: msg.content,
      timestamp: msg.createdAt,
      user: {
        _id: (msg.senderId as any)?.toString?.() || '',
        name: msg.senderName || 'Unknown',
      },
      type: msg.type,
    }));

    sendSuccess(res, { messages: items, pagination: { limit, count: items.length } });
  } catch (err) {
    next(err);
  }
}

export async function postRoomMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const content = String(req.body?.content || '').trim();
    if (!content) {
      sendError(res, 'Message content is required', 400);
      return;
    }

    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    const message = {
      senderId: req.user!._id as any,
      senderName: req.user!.name,
      content,
      type: 'text' as const,
      createdAt: new Date(),
    };

    room.chatMessages.push(message as any);
    await room.save();

    sendSuccess(
      res,
      {
        message: {
          content,
          timestamp: message.createdAt,
          user: { _id: req.user!._id, name: req.user!.name },
        },
      },
      'Message sent',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getRoomMessageStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    sendSuccess(res, {
      totalMessages: room.chatMessages.length,
      totalMembers: room.members.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRoomQuizzes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    const quizzes = (room.quizzes || []).map((quiz) => ({
      _id: quiz.quizId,
      quizId: quiz.quizId,
      questions: quiz.questions || [],
      createdAt: quiz.createdAt,
      milestoneRef: quiz.milestoneRef,
    }));

    sendSuccess(res, { quizzes });
  } catch (err) {
    next(err);
  }
}

export async function getKanbanBoard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    const userId = req.params.userId;

    // Auto-promote WAITING members who try to access their kanban
    const member = room.members.find(
      (m) => m.userId.toString() === userId || (m.userId as any)?._id?.toString() === userId
    );
    if (member && member.joinStatus === 'WAITING') {
      console.log(`[Kanban] Auto-promoting WAITING member ${userId} to ACCEPTED`);
      member.joinStatus = 'ACCEPTED';
      room.markModified('members');
    }

    let board = room.kanbanBoards.find((b) => b.userId.toString() === userId);
    if (!board) {
      room.kanbanBoards.push({ userId: req.user!._id as any, tasks: [] } as any);
      board = room.kanbanBoards[room.kanbanBoards.length - 1];
    }

    // If board has no tasks, generate them from the roadmap
    if (board.tasks.length === 0) {
      console.log(`[Kanban] Board empty for ${userId}, generating tasks from roadmap`);
      const { generateTasksForUser } = await import('../services/taskGenerator.service');
      generateTasksForUser(room, userId);
      room.markModified('kanbanBoards');
      // Re-find after generation
      board = room.kanbanBoards.find((b) => b.userId.toString() === userId)!;
    }

    // Save any changes (promotion + task generation)
    if (room.isModified()) {
      await room.save();
    }

    const kanban = {
      backlog: board.tasks.filter((t) => t.column === 'backlog'),
      todo: board.tasks.filter((t) => t.column === 'todo'),
      inProgress: board.tasks.filter((t) => t.column === 'inProgress'),
      done: board.tasks.filter((t) => t.column === 'done'),
    };

    sendSuccess(res, { kanban });
  } catch (err) {
    next(err);
  }
}

export async function moveKanbanTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId, toColumn } = req.body || {};
    if (!taskId || !toColumn) {
      sendError(res, 'taskId and toColumn are required', 400);
      return;
    }

    const allowedColumns = new Set(['backlog', 'todo', 'inProgress', 'done']);
    if (!allowedColumns.has(toColumn)) {
      sendError(res, 'Invalid destination column', 400);
      return;
    }

    const room = await roomService.getRoomById(req.params.roomId, req.user!._id);
    const board = room.kanbanBoards.find((b) => b.userId.toString() === req.params.userId);

    if (!board) {
      sendError(res, 'Kanban board not found', 404);
      return;
    }

    const task = board.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    task.column = toColumn;
    if (toColumn === 'done') {
      task.completedAt = new Date();
    }

    await room.save();
    sendSuccess(res, { task }, 'Kanban task moved');
  } catch (err) {
    next(err);
  }
}
