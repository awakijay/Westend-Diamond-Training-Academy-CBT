import { Router } from 'express';
import { readStore } from '../../lib/store.js';
import { getCandidateSubjectsResponse } from './subjects.responses.js';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await readStore((store) => getCandidateSubjectsResponse(store));

  res.json({ items });
});

export default router;
