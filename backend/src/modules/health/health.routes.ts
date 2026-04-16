import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'westend-diamond-cbt-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;

