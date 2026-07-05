import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { generateTopicContent } from '../services/content.service';
import { sendSuccess, sendError } from '../utils/response.utils';

const generateContentSchema = z.object({
  topicTitle: z.string().min(2).max(200),
  roadmapContext: z.string().max(500).optional(),
});

export async function generateContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = generateContentSchema.safeParse(req.body);
    if (!result.success) {
      sendError(res, result.error.flatten() as any, 400);
      return;
    }

    const content = await generateTopicContent(
      result.data.topicTitle,
      result.data.roadmapContext
    );

    sendSuccess(res, content, 'Content generated successfully');
  } catch (err) {
    next(err);
  }
}
