import { z } from 'zod';

export const generateRoadmapSchema = z.object({
  goal: z.string().min(5).max(200),
  tags: z.array(z.string().min(1)).min(1).max(8),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  durationWeeks: z.number().int().min(1).max(52),
});

export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;
