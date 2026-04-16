import { Router } from 'express';
import { resultIdParamSchema, resultsQuerySchema } from './results.schema.js';
import { validate } from '../../common/validation/validate.js';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.get('/', validate({ query: resultsQuerySchema }), (_req, res) => {
  return notImplemented(res, 'List results', [
    'Support search, sort, academic year filter, and pagination',
  ]);
});

router.get('/:id', validate({ params: resultIdParamSchema }), (_req, res) => {
  return notImplemented(res, 'Get result detail', [
    'Return per-section breakdown and learner/session summary',
  ]);
});

export default router;

