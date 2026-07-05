import { z } from 'zod';

export const focusSessionSchema = z.object({
  topicId: z.string(),
  durationMinutes: z.number().int().min(1).max(180),
});

export type FocusSessionInput = z.infer<typeof focusSessionSchema>;
