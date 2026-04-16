import { Router } from 'express';
import {
  subjectBodySchema,
  subjectIdParamSchema,
  updateSubjectBodySchema,
} from './subjects.schema.js';
import { validate } from '../../common/validation/validate.js';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.get('/', (_req, res) => {
  return notImplemented(res, 'List subjects', [
    'Return active subjects with question bank counts',
  ]);
});

router.post('/', validate({ body: subjectBodySchema }), (_req, res) => {
  return notImplemented(res, 'Create subject', [
    'Persist name, timer, and question count',
    'Enforce unique subject names',
  ]);
});

router.patch(
  '/:id',
  validate({ params: subjectIdParamSchema, body: updateSubjectBodySchema }),
  (_req, res) => {
    return notImplemented(res, 'Update subject', [
      'Support subject rename without breaking historical records',
      'Decide whether existing UIN assignments should update automatically',
    ]);
  }
);

router.delete('/:id', validate({ params: subjectIdParamSchema }), (_req, res) => {
  return notImplemented(res, 'Delete subject', [
    'Prefer soft delete or deactivation',
    'Protect historical sessions and results',
  ]);
});

export default router;

