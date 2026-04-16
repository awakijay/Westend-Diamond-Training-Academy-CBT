import { Router } from 'express';
import { adminLoginBodySchema } from './admin-auth.schema.js';
import { validate } from '../../common/validation/validate.js';
import { notImplemented } from '../../common/utils/not-implemented.js';

const router = Router();

router.post('/login', validate({ body: adminLoginBodySchema }), (_req, res) => {
  return notImplemented(res, 'Admin login', [
    'Verify username and password against the admins table',
    'Return JWT or secure session cookie',
    'Record lastLoginAt and audit log entry',
  ]);
});

router.post('/logout', (_req, res) => {
  return notImplemented(res, 'Admin logout', [
    'Invalidate token or destroy session',
  ]);
});

router.get('/me', (_req, res) => {
  return notImplemented(res, 'Admin session restore', [
    'Add auth middleware',
    'Return the current authenticated admin profile',
  ]);
});

export default router;

