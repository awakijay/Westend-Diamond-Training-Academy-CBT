import { z } from 'zod';
import { idParamSchema } from '../../common/validation/schemas.js';

export const subjectBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  timeLimitSeconds: z.coerce.number().int().positive(),
  questionCount: z.coerce.number().int().min(0),
});

export const updateSubjectBodySchema = subjectBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'Provide at least one field to update',
  }
);

export const subjectIdParamSchema = idParamSchema;

