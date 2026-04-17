import { Router } from 'express';
import {
  subjectBodySchema,
  subjectIdParamSchema,
  updateSubjectBodySchema,
} from './subjects.schema.js';
import { validate } from '../../common/validation/validate.js';
import { createHttpError } from '../../common/errors/http-error.js';
import { getAuthenticatedAdmin } from '../../common/middleware/require-admin-auth.js';
import { addAuditLog, generateId, mutateStore, nowIso, readStore } from '../../lib/store.js';
import { toSubjectResponse } from '../../common/utils/serializers.js';
import { getActiveSubjectsResponse } from './subjects.responses.js';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await readStore((store) => getActiveSubjectsResponse(store));

  res.json({ items });
});

router.post('/', validate({ body: subjectBodySchema }), async (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  const { name, timeLimitSeconds, questionCount } = req.body;

  const subject = await mutateStore((store) => {
    const existingSubject = store.subjects.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSubject) {
      throw createHttpError(409, 'A subject with that name already exists');
    }

    const timestamp = nowIso();
    const createdSubject = {
      id: generateId(),
      name,
      timeLimitSeconds,
      questionCount,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.subjects.push(createdSubject);
    addAuditLog(store, {
      adminId: admin.id,
      action: 'CREATE_SUBJECT',
      entityType: 'SUBJECT',
      entityId: createdSubject.id,
      payload: req.body,
    });

    return toSubjectResponse(store, createdSubject);
  });

  res.status(201).json(subject);
});

router.patch(
  '/:id',
  validate({ params: subjectIdParamSchema, body: updateSubjectBodySchema }),
  async (req, res) => {
    const admin = getAuthenticatedAdmin(req);
    const { id } = req.params;

    const subject = await mutateStore((store) => {
      const existingSubject = store.subjects.find((item) => item.id === id);

      if (!existingSubject) {
        throw createHttpError(404, 'Subject not found');
      }

      if (req.body.name) {
        const duplicateSubject = store.subjects.find(
          (item) =>
            item.id !== existingSubject.id &&
            item.name.toLowerCase() === req.body.name.toLowerCase()
        );

        if (duplicateSubject) {
          throw createHttpError(409, 'A subject with that name already exists');
        }

        existingSubject.name = req.body.name;
      }

      if (typeof req.body.timeLimitSeconds === 'number') {
        existingSubject.timeLimitSeconds = req.body.timeLimitSeconds;
      }

      if (typeof req.body.questionCount === 'number') {
        existingSubject.questionCount = req.body.questionCount;
      }

      existingSubject.updatedAt = nowIso();

      addAuditLog(store, {
        adminId: admin.id,
        action: 'UPDATE_SUBJECT',
        entityType: 'SUBJECT',
        entityId: existingSubject.id,
        payload: req.body,
      });

      return toSubjectResponse(store, existingSubject);
    });

    res.json(subject);
  }
);

router.delete('/:id', validate({ params: subjectIdParamSchema }), async (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  const { id } = req.params;

  const subject = await mutateStore((store) => {
    const existingSubject = store.subjects.find((item) => item.id === id);

    if (!existingSubject) {
      throw createHttpError(404, 'Subject not found');
    }

    existingSubject.isActive = false;
    existingSubject.updatedAt = nowIso();

    addAuditLog(store, {
      adminId: admin.id,
      action: 'DEACTIVATE_SUBJECT',
      entityType: 'SUBJECT',
      entityId: existingSubject.id,
      payload: {
        name: existingSubject.name,
      },
    });

    return toSubjectResponse(store, existingSubject);
  });

  res.json(subject);
});

export default router;
