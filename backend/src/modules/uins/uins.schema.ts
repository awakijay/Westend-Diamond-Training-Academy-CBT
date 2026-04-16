import { z } from 'zod';
import { idParamSchema } from '../../common/validation/schemas.js';

export const uinQuerySchema = z.object({
  status: z.enum(['available', 'used', 'all']).optional(),
  search: z.string().trim().min(1).optional(),
});

export const generateUinsBodySchema = z
  .object({
    count: z.coerce.number().int().min(1).max(100),
    subjectIds: z.array(z.string().trim().min(1)).min(1),
    subjectsPerUin: z.coerce.number().int().min(1),
  })
  .refine((value) => value.subjectsPerUin <= value.subjectIds.length, {
    message: 'subjectsPerUin cannot exceed the number of selected subjectIds',
    path: ['subjectsPerUin'],
  });

export const uinIdParamSchema = idParamSchema;

