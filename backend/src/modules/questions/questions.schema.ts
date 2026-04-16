import { z } from 'zod';
import { idParamSchema, paginationQuerySchema } from '../../common/validation/schemas.js';

const answerEnum = z.enum(['A', 'B', 'C', 'D']);

export const questionQuerySchema = paginationQuerySchema.extend({
  subjectId: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

export const questionBodySchema = z.object({
  subjectId: z.string().trim().min(1),
  question: z.string().trim().min(1),
  imageUrl: z.string().trim().min(1).optional(),
  optionA: z.string().trim().min(1),
  optionB: z.string().trim().min(1),
  optionC: z.string().trim().min(1),
  optionD: z.string().trim().min(1),
  correctAnswer: answerEnum,
});

export const updateQuestionBodySchema = questionBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'Provide at least one field to update',
  }
);

export const questionIdParamSchema = idParamSchema;

