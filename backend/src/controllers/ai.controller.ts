import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';
import { z } from 'zod';
import { generateRoadmapSchema } from '../validators/ai.validators';
import { sendSuccess, sendError } from '../utils/response.utils';

const generateQuizSchema = z.object({
  topic: z.string().min(2).max(120),
  currentMilestone: z.string().optional(),
  difficulty: z.string().optional(),
  count: z.number().int().min(1).max(20).optional(),
  userProgress: z
    .object({
      completedTopics: z.array(z.string()).optional(),
      currentPhase: z.number().optional(),
    })
    .optional(),
});

const roomSummarySchema = z.object({
  roomTitle: z.string().min(2).max(120),
  description: z.string().optional(),
  topics: z.array(z.string()).min(1).max(12),
  durationDays: z.number().int().min(1).max(365),
  skillLevel: z.string().optional(),
  dailyTime: z.string().optional(),
  goal: z.string().optional(),
});

const textSchema = z.object({
  prompt: z.string().min(2).max(4000),
  maxTokens: z.number().int().min(50).max(2000).optional(),
});

export async function generateRoadmap(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = generateRoadmapSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, result.error.flatten() as any, 400);
      return;
    }

    // Pass the ENTIRE validated input — goal, tags, skillLevel, durationWeeks all preserved
    const roadmap = await aiService.generateRoadmap(result.data);
    sendSuccess(res, { roadmap }, 'Roadmap generated successfully');
  } catch (err) {
    next(err);
  }
}

export async function generateQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = generateQuizSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, result.error.flatten() as any, 400);
      return;
    }

    const coveredMilestones = result.data.userProgress?.completedTopics ?? [];
    const questions = await aiService.generateQuiz(result.data.topic, coveredMilestones);

    sendSuccess(
      res,
      {
        topic: result.data.topic,
        difficulty: result.data.difficulty ?? 'medium',
        items: questions,
      },
      'Quiz generated successfully'
    );
  } catch (err) {
    next(err);
  }
}

export async function generateRoomSummary(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const result = roomSummarySchema.safeParse(req.body);
  if (!result.success) {
    sendError(res, result.error.flatten() as any, 400);
    return;
  }

  const payload = result.data;
  const estimatedWeeks = Math.max(1, Math.ceil(payload.durationDays / 7));
  const dailyTime = payload.dailyTime ?? '1 hour/day';
  const rawLevel = (payload.skillLevel ?? 'beginner').toLowerCase();
  const skillLevel = ['beginner', 'intermediate', 'advanced'].includes(rawLevel)
    ? rawLevel
    : 'beginner';

  const fallback = {
    summary: `A ${estimatedWeeks}-week plan focused on ${payload.topics.slice(0, 4).join(', ')}.`,
    feedback: `This roadmap is realistic for ${dailyTime} at a ${skillLevel} level.`,
    estimatedCompletion: `${estimatedWeeks} weeks`,
    intensityLevel: payload.durationDays <= 21 ? 'High' : payload.durationDays <= 56 ? 'Moderate' : 'Balanced',
    recommendations: [
      'Keep sessions consistent and short instead of occasional long sessions.',
      'Review progress weekly and adjust milestones based on blockers.',
      'Prioritize one core milestone before expanding scope.',
    ],
  };

  try {
    const prompt = [
      'Return valid JSON only with keys: summary, feedback, estimatedCompletion, intensityLevel, recommendations.',
      `Room title: ${payload.roomTitle}`,
      `Goal: ${payload.goal ?? payload.roomTitle}`,
      `Topics: ${payload.topics.join(', ')}`,
      `Duration days: ${payload.durationDays}`,
      `Skill level: ${skillLevel}`,
      `Daily time: ${dailyTime}`,
      `Description: ${payload.description ?? ''}`,
      'Recommendations must be an array of 3 concise strings.',
    ].join('\n');

    const generated = await aiService.generateText(prompt, 500);
    const parsed = JSON.parse(generated);
    sendSuccess(
      res,
      {
        summary: {
          summary: parsed.summary ?? fallback.summary,
          feedback: parsed.feedback ?? fallback.feedback,
          estimatedCompletion: parsed.estimatedCompletion ?? fallback.estimatedCompletion,
          intensityLevel: parsed.intensityLevel ?? fallback.intensityLevel,
          recommendations:
            Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
              ? parsed.recommendations
              : fallback.recommendations,
        },
      },
      'Room summary generated successfully'
    );
  } catch {
    sendSuccess(res, { summary: fallback }, 'Room summary generated successfully');
  }
}

export async function generateText(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const result = textSchema.safeParse(req.body);
  if (!result.success) {
    sendError(res, result.error.flatten() as any, 400);
    return;
  }

  try {
    const text = await aiService.generateText(
      result.data.prompt,
      result.data.maxTokens ?? 200
    );
    sendSuccess(res, { text }, 'Text generated successfully');
  } catch {
    // Never hard-fail chat-assist interactions in the create-room UX.
    sendSuccess(
      res,
      {
        text: 'Try tightening one milestone scope and extending difficult topics by 2-3 days for a more reliable pace.',
      },
      'Text generated successfully'
    );
  }
}
