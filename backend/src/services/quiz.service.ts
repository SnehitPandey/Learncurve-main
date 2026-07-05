import crypto from 'crypto';
import Room from '../models/room.model';
import { generateQuiz } from './ai.service';
import { NotFoundError, UnauthorizedError, AppError } from '../utils/errors';

export async function generateQuizForUser(
  roomId: string,
  userId: string,
  requestedTopics?: string[],
  questionCount?: number
) {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const member = room.members.find(
    (m) => m.userId.toString() === userId && m.joinStatus === 'ACCEPTED'
  );
  if (!member) throw new UnauthorizedError('Not an accepted member of this room');

  let coveredMilestones: string[] = [];

  // If specific topics were provided by the frontend, use them directly
  if (requestedTopics && requestedTopics.length > 0) {
    coveredMilestones = requestedTopics;
  } else {
    // Fallback: collect milestones the user has marked done on their kanban board
    const board = room.kanbanBoards.find(
      (b) => b.userId.toString() === userId
    );
    const doneMilestoneRefs = new Set(
      board?.tasks
        .filter((t) => t.column === 'done')
        .map((t) => t.milestoneRef) ?? []
    );

    for (const phase of room.roadmap?.phases ?? []) {
      for (const milestone of phase.milestones) {
        if (doneMilestoneRefs.has(milestone.milestoneId)) {
          coveredMilestones.push(`${milestone.title}: ${milestone.description}`);
        }
      }
    }
  }

  if (coveredMilestones.length === 0) {
    throw new AppError('Complete at least one milestone before taking a quiz', 400);
  }

  const questions = await generateQuiz(room.topic || room.title, coveredMilestones);

  const quiz = {
    quizId: crypto.randomUUID(),
    generatedFor: member.userId,
    milestoneRef: member.progress.currentMilestoneId ?? '',
    questions: questions.map((q, i) => ({
      questionId: q.questionId || `q${i + 1}`,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
    })),
    results: [],
    createdAt: new Date(),
  };

  room.quizzes.push(quiz as any);
  await room.save();

  // Return quiz WITHOUT correctIndex
  return {
    quizId: quiz.quizId,
    milestoneRef: quiz.milestoneRef,
    questions: quiz.questions.map((q) => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options,
    })),
    createdAt: quiz.createdAt,
  };
}

export async function submitQuizAnswers(
  roomId: string,
  quizId: string,
  userId: string,
  answers: number[]
) {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const quiz = room.quizzes.find((q) => q.quizId === quizId);
  if (!quiz) throw new NotFoundError('Quiz not found');

  // Grade
  let correct = 0;
  for (let i = 0; i < quiz.questions.length; i++) {
    if (answers[i] === quiz.questions[i].correctIndex) {
      correct++;
    }
  }

  const score = Math.round((correct / quiz.questions.length) * 100);

  quiz.results.push({
    userId: userId as any,
    answers,
    score,
    submittedAt: new Date(),
  } as any);

  await room.save();

  return {
    score,
    correctAnswers: correct,
    totalQuestions: quiz.questions.length,
  };
}

export async function getQuiz(
  roomId: string,
  quizId: string,
  userId: string
) {
  const room = await Room.findById(roomId);
  if (!room) throw new NotFoundError('Room not found');

  const isMember = room.members.some(
    (m) => m.userId.toString() === userId && m.joinStatus === 'ACCEPTED'
  );
  if (!isMember) throw new UnauthorizedError('Not an accepted member');

  const quiz = room.quizzes.find((q) => q.quizId === quizId);
  if (!quiz) throw new NotFoundError('Quiz not found');

  // Strip correctIndex from response
  return {
    quizId: quiz.quizId,
    generatedFor: quiz.generatedFor,
    milestoneRef: quiz.milestoneRef,
    questions: quiz.questions.map((q) => ({
      questionId: q.questionId,
      text: q.text,
      options: q.options,
    })),
    results: quiz.results,
    createdAt: quiz.createdAt,
  };
}
