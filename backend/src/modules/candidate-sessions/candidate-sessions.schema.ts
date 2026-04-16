import { z } from 'zod';
import { sessionIdParamSchema } from '../../common/validation/schemas.js';

const answerEnum = z.enum(['A', 'B', 'C', 'D']);

export const startSessionBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  surname: z.string().trim().min(1).max(80),
  uin: z.string().trim().regex(/^TRN-[A-Z0-9]{6}$/),
});

export const answerBodySchema = z.object({
  sessionQuestionId: z.string().trim().min(1),
  answer: answerEnum,
  currentQuestionIndex: z.coerce.number().int().min(0),
  currentSection: z.coerce.number().int().min(0),
});

export const advanceSectionBodySchema = z.object({
  nextSectionIndex: z.coerce.number().int().min(0),
});

export const candidateSessionIdParamSchema = sessionIdParamSchema;

