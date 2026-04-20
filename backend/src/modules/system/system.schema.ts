import { z } from 'zod';

export const restoreDefaultBodySchema = z.object({
  confirmation: z.literal('RESET_ALL_DATA'),
});
