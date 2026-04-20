import { Router } from 'express';
import { readStore } from '../../lib/store.js';

const router = Router();

router.get('/', async (_req, res) => {
  const dataVersion = await readStore((store) => store.meta.dataVersion);

  res.json({
    dataVersion,
    status: 'ok',
    service: 'westend-diamond-cbt-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;
