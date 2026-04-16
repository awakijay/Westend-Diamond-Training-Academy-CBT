import { z } from 'zod';

export const adminLoginBodySchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(255),
});

