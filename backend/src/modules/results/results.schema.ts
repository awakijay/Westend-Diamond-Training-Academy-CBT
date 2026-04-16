import { z } from 'zod';
import { idParamSchema, paginationQuerySchema } from '../../common/validation/schemas.js';

export const resultsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['date', 'score', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  academicYear: z.string().trim().min(1).optional(),
});

export const resultIdParamSchema = idParamSchema;

