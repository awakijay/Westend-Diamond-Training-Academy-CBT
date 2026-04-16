import { Router } from 'express';
import {
  questionBodySchema,
  questionIdParamSchema,
  questionQuerySchema,
  updateQuestionBodySchema,
} from './questions.schema.js';
import { validate } from '../../common/validation/validate.js';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.get('/', validate({ query: questionQuerySchema }), (_req, res) => {
  return notImplemented(res, 'List questions', [
    'Support subject filtering, text search, and pagination',
  ]);
});

router.post('/', validate({ body: questionBodySchema }), (_req, res) => {
  return notImplemented(res, 'Create question', [
    'Persist question with subject relation',
    'Validate correctAnswer and option completeness',
  ]);
});

router.patch(
  '/:id',
  validate({ params: questionIdParamSchema, body: updateQuestionBodySchema }),
  (_req, res) => {
    return notImplemented(res, 'Update question', [
      'Allow edits for future sessions only',
      'Preserve historical session snapshots',
    ]);
  }
);

router.delete('/:id', validate({ params: questionIdParamSchema }), (_req, res) => {
  return notImplemented(res, 'Delete question', [
    'Prefer deactivation over hard delete',
  ]);
});

export default router;

