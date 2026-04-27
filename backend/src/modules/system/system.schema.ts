import { z } from 'zod';

export const restoreDefaultBodySchema = z.object({
  confirmation: z.literal('RESET_ALL_DATA'),
});

export const updateExamSettingsBodySchema = z
  .object({
    randomizeQuestionsForStudents: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one setting to update',
  });
