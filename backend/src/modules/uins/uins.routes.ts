import { Router } from 'express';
import {
  generateUinsBodySchema,
  uinIdParamSchema,
  uinQuerySchema,
} from './uins.schema.js';
import { validate } from '../../common/validation/validate.js';
import { createHttpError } from '../../common/errors/http-error.js';
import { getAuthenticatedAdmin } from '../../common/middleware/require-admin-auth.js';
import { UIN_PREFIX } from '../../config/constants.js';
import { addAuditLog, generateId, mutateStore, nowIso, readStore } from '../../lib/store.js';
import { toUinResponse } from '../../common/utils/serializers.js';

const router = Router();

const createUinCode = (existingCodes: Set<string>) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  while (true) {
    let code = UIN_PREFIX;

    for (let index = 0; index < 6; index += 1) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    if (!existingCodes.has(code)) {
      return code;
    }
  }
};

router.get('/', validate({ query: uinQuerySchema }), async (req, res) => {
  const status = req.query.status ?? 'all';
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : undefined;

  const response = await readStore((store) => {
    const items = store.uins
      .filter((uin) => {
        if (status === 'available') {
          return uin.status === 'AVAILABLE' && !uin.isUsed;
        }

        if (status === 'used') {
          return uin.isUsed;
        }

        return true;
      })
      .filter((uin) => {
        if (!search) {
          return true;
        }

        const usedBy = [uin.usedByName, uin.usedBySurname].filter(Boolean).join(' ').toLowerCase();
        return uin.code.toLowerCase().includes(search) || usedBy.includes(search);
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((uin) => toUinResponse(store, uin));

    return {
      items,
      summary: {
        total: store.uins.length,
        available: store.uins.filter(
          (uin) => uin.status === 'AVAILABLE' && !uin.isUsed
        ).length,
        locked: store.uins.filter((uin) => uin.status === 'LOCKED').length,
        used: store.uins.filter((uin) => uin.isUsed).length,
        void: store.uins.filter((uin) => uin.status === 'VOID').length,
      },
    };
  });

  res.json(response);
});

router.post('/generate', validate({ body: generateUinsBodySchema }), async (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  const { count, subjectIds, subjectsPerUin } = req.body as {
    count: number;
    subjectIds: string[];
    subjectsPerUin: number;
  };

  const response = await mutateStore((store) => {
    const selectedSubjectIds = subjectIds.slice(0, subjectsPerUin);
    const uniqueSelectedIds = [...new Set(selectedSubjectIds)];

    if (uniqueSelectedIds.length !== selectedSubjectIds.length) {
      throw createHttpError(400, 'Duplicate subject ids are not allowed');
    }

    const selectedSubjects = uniqueSelectedIds.map((subjectId) =>
      store.subjects.find((subject) => subject.id === subjectId && subject.isActive)
    );

    if (selectedSubjects.some((subject) => !subject)) {
      throw createHttpError(404, 'One or more selected subjects do not exist');
    }

    const insufficientQuestionBanks = selectedSubjects
      .filter((subject): subject is NonNullable<(typeof selectedSubjects)[number]> => Boolean(subject))
      .map((subject) => {
        const availableQuestions = store.questions.filter(
          (question) => question.subjectId === subject.id && question.isActive
        ).length;

        return {
          subjectId: subject.id,
          subjectName: subject.name,
          availableQuestions,
          requiredQuestions: subject.questionCount,
        };
      })
      .filter((subject) => subject.availableQuestions < subject.requiredQuestions);

    if (insufficientQuestionBanks.length > 0) {
      throw createHttpError(
        409,
        'Selected courses do not have enough active questions for UIN generation',
        {
          subjects: insufficientQuestionBanks,
        }
      );
    }

    const existingCodes = new Set(store.uins.map((uin) => uin.code));
    const timestamp = nowIso();
    const created = [];

    for (let index = 0; index < count; index += 1) {
      const uin = {
        id: generateId(),
        code: createUinCode(existingCodes),
        status: 'AVAILABLE' as const,
        isUsed: false,
        usedByName: null,
        usedBySurname: null,
        usedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      existingCodes.add(uin.code);
      store.uins.push(uin);

      uniqueSelectedIds.forEach((subjectId, orderIndex) => {
        store.uinSubjects.push({
          id: generateId(),
          uinId: uin.id,
          subjectId,
          orderIndex,
          createdAt: timestamp,
        });
      });

      created.push(toUinResponse(store, uin));
    }

    addAuditLog(store, {
      adminId: admin.id,
      action: 'GENERATE_UINS',
      entityType: 'UIN_BATCH',
      entityId: null,
      payload: {
        count,
        subjectIds: uniqueSelectedIds,
        subjectsPerUin,
      },
    });

    return {
      created,
    };
  });

  res.status(201).json(response);
});

router.delete('/:id', validate({ params: uinIdParamSchema }), async (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  const { id } = req.params;

  const uin = await mutateStore((store) => {
    const existingUin = store.uins.find((item) => item.id === id);

    if (!existingUin) {
      throw createHttpError(404, 'UIN not found');
    }

    if (existingUin.isUsed || existingUin.status === 'LOCKED') {
      throw createHttpError(409, 'Only unused available UINs can be voided');
    }

    existingUin.status = 'VOID';
    existingUin.updatedAt = nowIso();

    addAuditLog(store, {
      adminId: admin.id,
      action: 'VOID_UIN',
      entityType: 'UIN',
      entityId: existingUin.id,
      payload: {
        code: existingUin.code,
      },
    });

    return toUinResponse(store, existingUin);
  });

  res.json(uin);
});

export default router;
