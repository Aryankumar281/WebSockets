import { z } from 'zod';

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minute: z.number().int().nonnegative(),
  sequence: z.any(),
  period: z.string(),
  eventType: z.any(),
  actor: z.any(),
  team: z.any(),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()),
});