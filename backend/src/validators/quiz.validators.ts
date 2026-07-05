import { z } from 'zod';

export const submitAnswersSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3)),
});

export type SubmitAnswersInput = z.infer<typeof submitAnswersSchema>;
