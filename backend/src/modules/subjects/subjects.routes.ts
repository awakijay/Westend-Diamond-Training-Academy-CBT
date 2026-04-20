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
import { cleanupUnusedUploadUrls } from '../../common/utils/upload-files.js';

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

  const subject = await mutateStore(async (store) => {
    const existingSubjectIndex = store.subjects.findIndex((item) => item.id === id);

    if (existingSubjectIndex === -1) {
      throw createHttpError(404, 'Subject not found');
    }

    const existingSubject = store.subjects[existingSubjectIndex];
    const response = toSubjectResponse(store, existingSubject);
    const deletedQuestions = store.questions.filter((item) => item.subjectId === id);
    const deletedQuestionCount = deletedQuestions.length;
    const deletedQuestionImageUrls = deletedQuestions.map((item) => item.imageUrl);
    const orphanedUnusedUinIds = new Set<string>();

    store.uinSubjects = store.uinSubjects.filter((assignment) => {
      if (assignment.subjectId !== id) {
        return true;
      }

      const linkedUin = store.uins.find((uin) => uin.id === assignment.uinId);

      if (linkedUin && !linkedUin.isUsed && linkedUin.status !== 'LOCKED') {
        orphanedUnusedUinIds.add(linkedUin.id);
      }

      return false;
    });

    store.questions = store.questions.filter((item) => item.subjectId !== id);
    store.subjects.splice(existingSubjectIndex, 1);

    store.uins = store.uins.filter((uin) => {
      if (!orphanedUnusedUinIds.has(uin.id)) {
        return true;
      }

      return store.uinSubjects.some((assignment) => assignment.uinId === uin.id);
    });

    addAuditLog(store, {
      adminId: admin.id,
      action: 'DELETE_SUBJECT',
      entityType: 'SUBJECT',
      entityId: existingSubject.id,
      payload: {
        name: existingSubject.name,
        deletedQuestionCount,
        deletedUnusedUinCount: [...orphanedUnusedUinIds].filter(
          (uinId) => !store.uinSubjects.some((assignment) => assignment.uinId === uinId)
        ).length,
      },
    });

    await cleanupUnusedUploadUrls(store, deletedQuestionImageUrls);

    return response;
  });

  res.json(subject);
});

export default router;
