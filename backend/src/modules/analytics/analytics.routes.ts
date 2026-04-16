import { Router } from 'express';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.get('/academic-years', (_req, res) => {
  return notImplemented(res, 'Academic year analytics', [
    'Return pass rate, average score, and test counts by academic year',
  ]);
});

export default router;
