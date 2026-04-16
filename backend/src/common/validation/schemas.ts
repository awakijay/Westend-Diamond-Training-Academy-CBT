import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().trim().min(1),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

