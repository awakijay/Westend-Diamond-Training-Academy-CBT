import { Router } from 'express';
import {
  questionBodySchema,
  questionIdParamSchema,
  questionQuerySchema,
  updateQuestionBodySchema,
} from './questions.schema.js';
import { validate } from '../../common/validation/validate.js';
import { createHttpError } from '../../common/errors/http-error.js';
import { getAuthenticatedAdmin } from '../../common/middleware/require-admin-auth.js';
import { addAuditLog, generateId, mutateStore, nowIso, readStore } from '../../lib/store.js';
import { toQuestionResponse } from '../../common/utils/serializers.js';
import { cleanupUnusedUploadUrls } from '../../common/utils/upload-files.js';

const router = Router();

router.get('/', validate({ query: questionQuerySchema }), async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : undefined;

  const response = await readStore((store) => {
    const filteredQuestions = store.questions
      .filter((question) => question.isActive)
      .filter((question) =>
        store.subjects.some((subject) => subject.id === question.subjectId && subject.isActive)
      )
      .filter((question) => (subjectId ? question.subjectId === subjectId : true))
      .filter((question) => {
        if (!search) {
          return true;
        }

        const haystack = [
          question.questionText,
          question.optionA,
          question.optionB,
          question.optionC,
          question.optionD,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const total = filteredQuestions.length;
    const startIndex = (page - 1) * limit;

    return {
      items: filteredQuestions
        .slice(startIndex, startIndex + limit)
        .map((question) => toQuestionResponse(store, question)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  });

  res.json(response);
});

router.post('/', validate({ body: questionBodySchema }), async (req, res) => {
  const admin = getAuthenticatedAdmin(req);

  const question = await mutateStore((store) => {
    const subject = store.subjects.find(
      (item) => item.id === req.body.subjectId && item.isActive
    );

    if (!subject) {
      throw createHttpError(404, 'Subject not found');
    }

    const timestamp = nowIso();
    const createdQuestion = {
      id: generateId(),
      subjectId: req.body.subjectId,
      questionText: req.body.question,
      imageUrl: req.body.imageUrl ?? null,
      optionA: req.body.optionA,
      optionB: req.body.optionB,
      optionC: req.body.optionC,
      optionD: req.body.optionD,
      correctAnswer: req.body.correctAnswer,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.questions.push(createdQuestion);
    addAuditLog(store, {
      adminId: admin.id,
      action: 'CREATE_QUESTION',
      entityType: 'QUESTION',
      entityId: createdQuestion.id,
      payload: req.body,
    });

    return toQuestionResponse(store, createdQuestion);
  });

  res.status(201).json(question);
});

router.patch(
  '/:id',
  validate({ params: questionIdParamSchema, body: updateQuestionBodySchema }),
  async (req, res) => {
    const admin = getAuthenticatedAdmin(req);
    const { id } = req.params;

    const question = await mutateStore(async (store) => {
      const existingQuestion = store.questions.find((item) => item.id === id);

      if (!existingQuestion) {
        throw createHttpError(404, 'Question not found');
      }

      const previousImageUrl = existingQuestion.imageUrl;

      if (req.body.subjectId) {
        const subject = store.subjects.find(
          (item) => item.id === req.body.subjectId && item.isActive
        );

        if (!subject) {
          throw createHttpError(404, 'Subject not found');
        }

        existingQuestion.subjectId = req.body.subjectId;
      }

      if (req.body.question) {
        existingQuestion.questionText = req.body.question;
      }

      if ('imageUrl' in req.body) {
        existingQuestion.imageUrl = req.body.imageUrl ?? null;
      }

      if (req.body.optionA) {
        existingQuestion.optionA = req.body.optionA;
      }

      if (req.body.optionB) {
        existingQuestion.optionB = req.body.optionB;
      }

      if (req.body.optionC) {
        existingQuestion.optionC = req.body.optionC;
      }

      if (req.body.optionD) {
        existingQuestion.optionD = req.body.optionD;
      }

      if (req.body.correctAnswer) {
        existingQuestion.correctAnswer = req.body.correctAnswer;
      }

      existingQuestion.updatedAt = nowIso();

      addAuditLog(store, {
        adminId: admin.id,
        action: 'UPDATE_QUESTION',
        entityType: 'QUESTION',
        entityId: existingQuestion.id,
        payload: req.body,
      });

      const response = toQuestionResponse(store, existingQuestion);

      if ('imageUrl' in req.body && previousImageUrl !== existingQuestion.imageUrl) {
        await cleanupUnusedUploadUrls(store, [previousImageUrl]);
      }

      return response;
    });

    res.json(question);
  }
);

router.delete('/:id', validate({ params: questionIdParamSchema }), async (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  const { id } = req.params;

  const question = await mutateStore(async (store) => {
    const existingQuestionIndex = store.questions.findIndex((item) => item.id === id);

    if (existingQuestionIndex === -1) {
      throw createHttpError(404, 'Question not found');
    }

    const existingQuestion = store.questions[existingQuestionIndex];
    const response = toQuestionResponse(store, existingQuestion);

    addAuditLog(store, {
      adminId: admin.id,
      action: 'DELETE_QUESTION',
      entityType: 'QUESTION',
      entityId: existingQuestion.id,
      payload: {
        question: existingQuestion.questionText,
      },
    });

    store.questions.splice(existingQuestionIndex, 1);
    await cleanupUnusedUploadUrls(store, [existingQuestion.imageUrl]);

    return response;
  });

  res.json(question);
});

export default router;
