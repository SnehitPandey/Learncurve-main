import Room from '../models/room.model';
import { generateFocusSummary, FocusSummaryResult } from './ai.service';
import { updateMemberProgress } from './room.service';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

export async function completeFocusSession(
  roomId: string,
  userId: string,
  topicId: string,
  durationMinutes: number
) {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const member = room.members.find(
    (m) => m.userId.toString() === userId && m.joinStatus === 'ACCEPTED'
  );
  if (!member) throw new UnauthorizedError('Not an accepted member of this room');

  // Find the topic from the roadmap
  let topicTitle = '';
  let topicDescription = '';
  for (const phase of room.roadmap?.phases ?? []) {
    for (const milestone of phase.milestones) {
      for (const topic of milestone.topics) {
        if (topic.topicId === topicId) {
          topicTitle = topic.title;
          topicDescription = topic.description;
        }
      }
    }
  }

  if (!topicTitle) throw new NotFoundError('Topic not found in roadmap');

  // AI summary — must never fail the session
  const summaryResult: FocusSummaryResult | null = await generateFocusSummary(
    topicTitle,
    topicDescription,
    durationMinutes
  );

  // Save focus session
  room.focusSessions.push({
    userId: userId as any,
    topicRef: topicId,
    durationMinutes,
    aiSummary: summaryResult?.summary ?? null,
    completedAt: new Date(),
  } as any);

  await room.save();

  // Bump progress
  const progressUpdate = await updateMemberProgress(roomId, userId, topicId);

  return {
    summary: summaryResult?.summary ?? null,
    keyTakeaways: summaryResult?.keyTakeaways ?? [],
    nextStepSuggestion: summaryResult?.nextStepSuggestion ?? null,
    updatedProgress: progressUpdate,
  };
}

export async function getUserFocusSessions(
  roomId: string,
  userId: string
) {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const isMember = room.members.some(
    (m) => m.userId.toString() === userId && m.joinStatus === 'ACCEPTED'
  );
  if (!isMember) throw new UnauthorizedError('Not an accepted member');

  return room.focusSessions.filter(
    (s) => s.userId.toString() === userId
  );
}
