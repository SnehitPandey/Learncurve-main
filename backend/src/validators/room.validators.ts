import { z } from 'zod';

export const createRoomSchema = z.object({
  title: z.string().min(3).max(100),
  topic: z.string().min(3).max(100),
  description: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
  skillLevel: z.string().optional(),
  maxSeats: z.number().int().min(2).max(20).optional(),
  generateRoadmap: z.boolean().optional(),
  expectedDurationDays: z.number().int().min(1).max(365).default(30).optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
