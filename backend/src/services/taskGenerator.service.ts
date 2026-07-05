import mongoose from 'mongoose';
import { IRoom, IKanbanBoard, IKanbanTask } from '../models/room.model';
import crypto from 'crypto';

interface FlatTopic {
  topicId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  phaseRef: string;
  milestoneRef: string;
}

function flattenTopics(room: any): FlatTopic[] {
  const topics: FlatTopic[] = [];
  
  // Handle both flat array of milestones (new format) and nested phases (old format)
  const isFlatRoadmap = Array.isArray(room.roadmap);
  const phases = isFlatRoadmap 
    ? [{ phaseId: 'p0', title: 'Phase', milestones: room.roadmap }] 
    : (room.roadmap?.phases ?? []);

  for (const phase of phases) {
    for (const milestone of phase.milestones ?? []) {
      for (const topic of milestone.topics ?? []) {
        topics.push({
          topicId: topic.topicId || topic._id?.toString() || crypto.randomUUID(),
          title: typeof topic === 'string' ? topic : (topic.title || 'Untitled'),
          description: topic.description || '',
          estimatedMinutes: topic.estimatedMinutes || 30, // Default 30 min if missing
          phaseRef: phase.phaseId || 'p0',
          milestoneRef: milestone.milestoneId || milestone._id?.toString() || 'm0',
        });
      }
    }
  }
  return topics;
}

/**
 * Generate kanban tasks for a single user based on expected progress.
 * Pure algorithmic — never calls AI.
 * Does NOT save — returns the mutated board so the caller can batch-save.
 */
export function generateTasksForUser(
  room: IRoom,
  userId: mongoose.Types.ObjectId | string
): IKanbanBoard | null {
  const uid = userId.toString();
  let board = room.kanbanBoards.find((b) => b.userId.toString() === uid);
  if (!board) {
    room.kanbanBoards.push({ userId: userId as any, tasks: [] } as any);
    board = room.kanbanBoards[room.kanbanBoards.length - 1];
  }

  const allTopics = flattenTopics(room);
  if (allTopics.length === 0) return board;

  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - new Date(room.startDate).getTime()) / 86_400_000)
  );
  const expectedProgressRatio =
    room.expectedDurationDays > 0
      ? daysSinceStart / room.expectedDurationDays
      : 0;

  const targetTopicIndex = Math.min(
    Math.floor(allTopics.length * expectedProgressRatio),
    allTopics.length - 1
  );

  // Existing task topicRefs for this user
  const existingTopicRefs = new Set(board.tasks.map((t) => t.topicRef));

  // Add ALL remaining topics that aren't already on the board
  for (let i = 0; i < allTopics.length; i++) {
    const topic = allTopics[i];
    if (existingTopicRefs.has(topic.topicId)) continue;

    const task: IKanbanTask = {
      taskId: crypto.randomUUID(),
      title: topic.title,
      description: topic.description,
      topicRef: topic.topicId,
      phaseRef: topic.phaseRef,
      milestoneRef: topic.milestoneRef,
      estimatedMinutes: topic.estimatedMinutes,
      scheduledDate: new Date(),
      column: i <= targetTopicIndex ? 'todo' : 'backlog',
    } as IKanbanTask;

    board.tasks.push(task);
  }

  return board;
}

/**
 * Regenerate daily tasks for ALL accepted members in a room.
 * Saves the room once after all boards are updated.
 */
export async function regenerateDailyTasks(room: IRoom): Promise<IRoom> {
  const acceptedMembers = room.members.filter(
    (m) => m.joinStatus === 'ACCEPTED'
  );

  for (const member of acceptedMembers) {
    generateTasksForUser(room, member.userId);
  }

  room.markModified('kanbanBoards');
  return room.save();
}
