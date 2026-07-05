import mongoose from 'mongoose';
import Room, { IRoom, IMember } from '../models/room.model';
import { generateRoadmap } from './ai.service';
import { generateTasksForUser } from './taskGenerator.service';
import { NotFoundError, UnauthorizedError, AppError } from '../utils/errors';
import type { RoadmapInput } from '../types/index.d';

interface CreateRoomInput {
  title: string;
  topic: string;
  description?: string;
  tags?: string[];
  skillLevel?: string;
  expectedDurationDays?: number;
}

function buildFallbackRoadmap(input: CreateRoomInput): any {
  const topic = input.topic || input.title;
  const tags = (input.tags ?? []).filter(Boolean);
  const seeds = tags.length > 0 ? tags.slice(0, 4) : [topic];

  const milestones = seeds.map((seed, index) => ({
    milestoneId: `m${index + 1}`,
    title: `${seed} fundamentals`,
    description: `Build practical confidence in ${seed} with focused exercises and short projects.`,
    topics: [
      {
        topicId: `m${index + 1}-t1`,
        title: `Understand ${seed} basics`,
        description: `Learn core ideas, terminology, and common patterns in ${seed}.`,
        estimatedMinutes: 60,
        resources: [],
        isCompleted: false,
      },
      {
        topicId: `m${index + 1}-t2`,
        title: `Practice ${seed} with guided examples`,
        description: `Apply ${seed} concepts by implementing a small, concrete task.`,
        estimatedMinutes: 90,
        resources: [],
        isCompleted: false,
      },
      {
        topicId: `m${index + 1}-t3`,
        title: `Debug and improve ${seed} solutions`,
        description: `Review mistakes, refactor the solution, and document learnings.`,
        estimatedMinutes: 60,
        resources: [],
        isCompleted: false,
      },
    ],
    isCompleted: false,
  }));

  return {
    phases: [
      {
        phaseId: 'phase-1',
        title: 'Learning Plan',
        description: `Structured roadmap for ${topic}.`,
        milestones,
      },
    ],
  };
}

export async function createRoom(
  hostId: string,
  input: CreateRoomInput
): Promise<IRoom> {
  const code = await Room.generateCode();
  const durationDays = input.expectedDurationDays ?? 30;

  // Normalize skillLevel — frontend may send 'Beginner', 'Intermediate', 'Advanced'
  const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
  const rawSkill = (input.skillLevel ?? 'beginner').toLowerCase();
  const skillLevel = (VALID_LEVELS.includes(rawSkill as any)
    ? rawSkill
    : 'beginner') as RoadmapInput['skillLevel'];

  // Build a rich goal string from title + description
  const goal = input.description
    ? `${input.title}: ${input.description}`
    : input.title;

  // Build RoadmapInput from room creation payload
  const roadmapInput: RoadmapInput = {
    goal,
    tags: input.tags ?? [],
    skillLevel,
    durationWeeks: Math.max(1, Math.round(durationDays / 7)),
  };

  // AI-generated roadmap with safe fallback so room creation never hard-fails.
  let roadmap: any;
  try {
    roadmap = await generateRoadmap(roadmapInput);
  } catch (error) {
    console.error('[RoomService] AI roadmap generation failed, using fallback roadmap:', error);
    roadmap = buildFallbackRoadmap(input);
  }


  const room = new Room({
    title: input.title,
    topic: input.topic,
    description: input.description,
    tags: input.tags ?? [],
    code,
    hostId,
    skillLevel,
    expectedDurationDays: durationDays,
    roadmap,
    members: [
      {
        userId: hostId,
        role: 'host',
        joinStatus: 'ACCEPTED',
        progress: { progressPercentage: 0, status: 'ON_TRACK' },
      },
    ],
    kanbanBoards: [{ userId: hostId, tasks: [] }],
  });

  // Pre-populate host's kanban
  generateTasksForUser(room, hostId);

  // CRITICAL: Mongoose does not detect deep nested array mutations.
  // Without markModified, room.save() writes nothing for kanbanBoards.
  room.markModified('kanbanBoards');
  await room.save();
  return room;
}

export async function joinRoom(
  userId: string,
  code: string
): Promise<IRoom> {
  const room = await Room.findOne({ code });
  if (!room) throw new NotFoundError('Room not found');

  const alreadyMember = room.members.some(
    (m) => m.userId.toString() === userId
  );
  if (alreadyMember) throw new AppError('Already a member of this room', 400);

  room.members.push({
    userId: new mongoose.Types.ObjectId(userId),
    role: 'member',
    joinStatus: 'ACCEPTED',
    progress: { progressPercentage: 0, status: 'ON_TRACK' },
    joinedAt: new Date(),
  } as IMember);

  room.kanbanBoards.push({
    userId: new mongoose.Types.ObjectId(userId),
    tasks: [],
  });

  // Pre-populate tasks for the newly joined user
  generateTasksForUser(room, userId);

  room.markModified('kanbanBoards');
  await room.save();
  return room;
}

export async function acceptMember(
  roomId: string,
  hostId: string,
  targetUserId: string
): Promise<IRoom> {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');
  if (room.hostId.toString() !== hostId) {
    throw new UnauthorizedError('Only the host can accept members');
  }

  const member = room.members.find(
    (m) => m.userId.toString() === targetUserId
  );
  if (!member) throw new NotFoundError('Member not found in room');
  if (member.joinStatus === 'ACCEPTED') {
    throw new AppError('Member already accepted', 400);
  }

  member.joinStatus = 'ACCEPTED';

  // Generate initial tasks for the new member
  generateTasksForUser(room, targetUserId);

  room.markModified('kanbanBoards');
  await room.save();
  return room;
}

export async function getRoomById(
  roomId: string,
  userId: string
): Promise<IRoom> {
  const room = await Room.findById(roomId).populate(
    'members.userId',
    'name email avatar isOnline'
  );
  if (!room) throw new NotFoundError('Room not found');

  const isMember = room.members.some(
    (m) => m.userId.toString() === userId || (m.userId as any)?._id?.toString() === userId
  );
  if (!isMember) throw new UnauthorizedError('Not a member of this room');

  return room;
}

export async function getUserRooms(userId: string): Promise<any[]> {
  const rooms = await Room.find({
    'members.userId': userId,
    'members.joinStatus': 'ACCEPTED',
  })
    .select('title topic description tags code status skillLevel startDate expectedDurationDays averageProgress members createdAt hostId')
    .populate('members.userId', 'name email avatar isOnline')
    .populate('hostId', 'name avatar profilePic avatarUrl customAvatarURL isCustomAvatar')
    .sort({ updatedAt: -1 })
    .lean();

  return rooms.map(room => ({
    ...room,
    id: room._id,
    memberCount: room.members.length,
    hostName: (room.hostId as any)?.name || 'Unknown',
  }));
}

export async function getPublicRooms(): Promise<IRoom[]> {
  return Room.find({ status: 'active' })
    .select('title topic description tags code status skillLevel hostId members expectedDurationDays createdAt')
    .populate('hostId', 'name avatar profilePic avatarUrl customAvatarURL isCustomAvatar')
    .sort({ updatedAt: -1 })
    .limit(50);
}

export async function leaveRoom(
  roomId: string,
  userId: string
): Promise<{ deleted: boolean }> {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const memberIndex = room.members.findIndex(
    (m) => m.userId.toString() === userId
  );
  if (memberIndex === -1) {
    throw new UnauthorizedError('Not a member of this room');
  }

  const wasHost = room.hostId.toString() === userId;

  room.members.splice(memberIndex, 1);
  room.kanbanBoards = room.kanbanBoards.filter(
    (board) => board.userId.toString() !== userId
  );

  if (room.members.length === 0) {
    await Room.findByIdAndDelete(roomId);
    return { deleted: true };
  }

  if (wasHost) {
    const acceptedMember = room.members.find((m) => m.joinStatus === 'ACCEPTED');
    const nextHost = acceptedMember ?? room.members[0];

    if (nextHost) {
      room.hostId = nextHost.userId as any;
      nextHost.role = 'host';
      nextHost.joinStatus = 'ACCEPTED';
    }
  }

  await room.save();
  return { deleted: false };
}

export async function updateMemberProgress(
  roomId: string,
  userId: string,
  _topicId: string
): Promise<{ averageProgress: number; memberProgress: any }> {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const member = room.members.find(
    (m) => m.userId.toString() === userId && m.joinStatus === 'ACCEPTED'
  );
  if (!member) throw new NotFoundError('Member not found');

  // Count total topics in the roadmap
  let totalTopics = 0;
  for (const phase of room.roadmap?.phases ?? []) {
    for (const milestone of phase.milestones) {
      totalTopics += milestone.topics.length;
    }
  }

  // Count completed tasks (done column) for this user
  const board = room.kanbanBoards.find(
    (b) => b.userId.toString() === userId
  );
  const doneTasks = board?.tasks.filter((t) => t.column === 'done').length ?? 0;

  // Update progress
  member.progress.progressPercentage =
    totalTopics > 0 ? Math.round((doneTasks / totalTopics) * 100) : 0;

  // Find current phase/milestone based on latest done task
  const latestDone = board?.tasks
    .filter((t) => t.column === 'done')
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    })[0];

  if (latestDone) {
    member.progress.currentPhaseId = latestDone.phaseRef;
    member.progress.currentMilestoneId = latestDone.milestoneRef;
  }

  // .save() triggers the pre-save hook that recalculates averageProgress and statuses
  await room.save();

  return {
    averageProgress: room.averageProgress,
    memberProgress: member.progress,
  };
}

export async function completeMilestoneTopic(
  roomId: string,
  userId: string,
  milestoneId: string,
  topicIndex: number
): Promise<{ averageProgress: number; memberProgress: any; completedTopics: number; totalTopics: number }> {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const member = room.members.find(
    (m) => m.userId.toString() === userId && m.joinStatus === 'ACCEPTED'
  );
  if (!member) throw new UnauthorizedError('Not an accepted member of this room');

  let targetPhaseIndex = -1;
  let targetMilestoneIndex = -1;

  const roadmapPhases = room.roadmap?.phases ?? [];

  for (let i = 0; i < roadmapPhases.length; i++) {
    const phase = roadmapPhases[i];
    const milestoneIndex = phase.milestones.findIndex((m) => m.milestoneId === milestoneId);
    if (milestoneIndex !== -1) {
      targetPhaseIndex = i;
      targetMilestoneIndex = milestoneIndex;
      break;
    }
  }

  // Backward compatibility: some frontend flows still send synthetic ids like "p0m1".
  if (targetPhaseIndex === -1 || targetMilestoneIndex === -1) {
    const syntheticMatch = /^p(\d+)m(\d+)$/i.exec(milestoneId);
    if (syntheticMatch) {
      const phaseIndex = Number(syntheticMatch[1]);
      const milestoneIndex = Number(syntheticMatch[2]);

      if (
        Number.isInteger(phaseIndex) &&
        Number.isInteger(milestoneIndex) &&
        phaseIndex >= 0 &&
        milestoneIndex >= 0 &&
        roadmapPhases[phaseIndex] &&
        roadmapPhases[phaseIndex].milestones[milestoneIndex]
      ) {
        targetPhaseIndex = phaseIndex;
        targetMilestoneIndex = milestoneIndex;
      }
    }
  }

  if (targetPhaseIndex === -1 || targetMilestoneIndex === -1) {
    throw new NotFoundError('Milestone not found');
  }

  const phase = room.roadmap.phases[targetPhaseIndex];
  const milestone = phase.milestones[targetMilestoneIndex];
  const topic = milestone.topics[topicIndex];

  if (!topic) {
    throw new NotFoundError('Topic not found in milestone');
  }

  topic.isCompleted = true;

  if (milestone.topics.length > 0 && milestone.topics.every((t) => t.isCompleted)) {
    milestone.isCompleted = true;
  }

  const board = room.kanbanBoards.find((b) => b.userId.toString() === userId);
  if (board) {
    const existingTask = board.tasks.find(
      (task) =>
        task.milestoneRef === milestone.milestoneId &&
        (task.topicRef === topic.topicId || task.title === topic.title)
    );

    if (existingTask) {
      existingTask.column = 'done';
      existingTask.completedAt = new Date();
    } else {
      board.tasks.push({
        taskId: `${milestone.milestoneId}-${topic.topicId || topicIndex}`,
        title: topic.title,
        description: topic.description,
        topicRef: topic.topicId,
        phaseRef: phase.phaseId,
        milestoneRef: milestone.milestoneId,
        estimatedMinutes: topic.estimatedMinutes,
        column: 'done',
        completedAt: new Date(),
      } as any);
    }
  }

  room.markModified('roadmap');
  room.markModified('kanbanBoards');
  await room.save();

  const progress = await updateMemberProgress(roomId, userId, topic.topicId || `${milestoneId}:${topicIndex}`);

  const totalTopics = (room.roadmap?.phases ?? []).reduce((phaseSum, p) => {
    return phaseSum + p.milestones.reduce((milestoneSum, m) => milestoneSum + m.topics.length, 0);
  }, 0);

  const refreshedRoom = await Room.findById(roomId);
  const refreshedBoard = refreshedRoom?.kanbanBoards.find((b) => b.userId.toString() === userId);
  const completedTopics = refreshedBoard?.tasks.filter((task) => task.column === 'done').length ?? 0;

  return {
    ...progress,
    completedTopics,
    totalTopics,
  };
}

export async function completeRoom(
  roomId: string,
  hostId: string
): Promise<IRoom> {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');
  if (room.hostId.toString() !== hostId) {
    throw new UnauthorizedError('Only the host can complete the room');
  }

  room.status = 'completed';
  await room.save();
  return room;
}
