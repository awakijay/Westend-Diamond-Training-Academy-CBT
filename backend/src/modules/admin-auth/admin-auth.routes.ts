import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { adminLoginBodySchema } from './admin-auth.schema.js';
import { validate } from '../../common/validation/validate.js';
import {
  createAdminToken,
  getAuthenticatedAdmin,
  requireAdminAuth,
} from '../../common/middleware/require-admin-auth.js';
import { createHttpError } from '../../common/errors/http-error.js';
import { addAuditLog, mutateStore, readStore, nowIso } from '../../lib/store.js';
import { toAdminResponse } from '../../common/utils/serializers.js';

const router = Router();

router.post('/login', validate({ body: adminLoginBodySchema }), async (req, res) => {
  const { username, password } = req.body;

  const response = await mutateStore(async (store) => {
    const admin = store.admins.find(
      (item) => item.username.toLowerCase() === username.toLowerCase()
    );

    if (!admin) {
      throw createHttpError(401, 'Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      throw createHttpError(401, 'Invalid username or password');
    }

    const timestamp = nowIso();
    admin.lastLoginAt = timestamp;
    admin.updatedAt = timestamp;

    addAuditLog(store, {
      adminId: admin.id,
      action: 'LOGIN',
      entityType: 'ADMIN',
      entityId: admin.id,
      payload: {
        username: admin.username,
      },
    });

    return {
      admin: toAdminResponse(admin),
      token: createAdminToken(admin),
    };
  });

  res.json(response);
});

router.post('/logout', requireAdminAuth, async (req, res) => {
  const admin = getAuthenticatedAdmin(req);

  await mutateStore(async (store) => {
    addAuditLog(store, {
      adminId: admin.id,
      action: 'LOGOUT',
      entityType: 'ADMIN',
      entityId: admin.id,
      payload: {
        username: admin.username,
      },
    });
  });

  res.json({
    message: 'Logged out successfully',
  });
});

router.get('/me', requireAdminAuth, async (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  const currentAdmin = await readStore(
    (store) => store.admins.find((item) => item.id === admin.id) ?? null
  );

  if (!currentAdmin) {
    throw createHttpError(401, 'Admin account no longer exists');
  }

  res.json({
    admin: toAdminResponse(currentAdmin),
  });
});

export default router;
