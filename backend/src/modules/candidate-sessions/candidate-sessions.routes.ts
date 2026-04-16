import { Router } from 'express';
import {
  advanceSectionBodySchema,
  answerBodySchema,
  candidateSessionIdParamSchema,
  startSessionBodySchema,
} from './candidate-sessions.schema.js';
import { validate } from '../../common/validation/validate.js';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.post('/start', validate({ body: startSessionBodySchema }), (_req, res) => {
  return notImplemented(res, 'Start candidate session', [
    'Validate UIN and subject assignment',
    'Lock the UIN atomically',
    'Persist section and question snapshots',
    'Return learner-safe question payload without answer keys',
  ]);
});

router.get('/:sessionId', validate({ params: candidateSessionIdParamSchema }), (_req, res) => {
  return notImplemented(res, 'Resume candidate session', [
    'Return saved answers and section timing state',
  ]);
});

router.patch(
  '/:sessionId/answers',
  validate({ params: candidateSessionIdParamSchema, body: answerBodySchema }),
  (_req, res) => {
    return notImplemented(res, 'Save candidate answer', [
      'Validate the session is active',
      'Validate the sessionQuestionId belongs to the session',
      'Reject writes after completion or expiry',
    ]);
  }
);

router.post(
  '/:sessionId/advance-section',
  validate({ params: candidateSessionIdParamSchema, body: advanceSectionBodySchema }),
  (_req, res) => {
    return notImplemented(res, 'Advance section', [
      'Lock the completed section',
      'Reset the next section timer using the session snapshot',
    ]);
  }
);

router.post(
  '/:sessionId/complete',
  validate({ params: candidateSessionIdParamSchema }),
  (_req, res) => {
    return notImplemented(res, 'Complete candidate session', [
      'Compute per-section score and total score',
      'Compute academic year and pass/fail status',
      'Persist result records and mark UIN as used',
    ]);
  }
);

export default router;

