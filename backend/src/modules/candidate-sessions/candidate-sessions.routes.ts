import { Router } from 'express';
import {
  advanceSectionBodySchema,
  answerBodySchema,
  candidateSessionIdParamSchema,
  startSessionBodySchema,
} from './candidate-sessions.schema.js';
import { validate } from '../../common/validation/validate.js';
import { createHttpError } from '../../common/errors/http-error.js';
import {
  calculatePercentage,
  calculateResultStatus,
  calculateSessionSectionScores,
  getAcademicYear,
  getSessionQuestion,
  getSessionQuestionsForSection,
  getSessionSections,
  syncSessionTimingState,
} from '../../common/utils/exam.js';
import { shuffleWithSeed } from '../../common/utils/random.js';
import { toResultResponse, toSessionResponse } from '../../common/utils/serializers.js';
import {
  generateId,
  mutateStore,
  nowIso,
  type DataStore,
  type TestResultRecord,
  type TestSessionRecord,
} from '../../lib/store.js';

const router = Router();

type SessionMutationResponse = {
  body: Record<string, unknown>;
  statusCode: number;
};

const getSingleParam = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getSessionOrThrow = (store: DataStore, sessionId: string) => {
  const session = store.sessions.find((item) => item.id === sessionId);

  if (!session) {
    throw createHttpError(404, 'Session not found');
  }

  return session;
};

const getResultBySessionId = (store: DataStore, sessionId: string) =>
  store.results.find((item) => item.sessionId === sessionId);

const completeSession = (
  store: DataStore,
  session: TestSessionRecord,
  completedAt = nowIso()
): TestResultRecord => {
  const existingResult = getResultBySessionId(store, session.id);
  const uin = store.uins.find((item) => item.id === session.uinId);

  if (!uin) {
    throw createHttpError(500, 'Session is linked to a missing UIN');
  }

  if (existingResult) {
    session.status = 'COMPLETED';
    session.completedAt = existingResult.completedAt;
    session.isOnSectionBreak = false;
    session.pendingSectionIndex = null;
    session.updatedAt = completedAt;
    uin.status = 'USED';
    uin.isUsed = true;
    uin.usedByName = session.candidateName;
    uin.usedBySurname = session.candidateSurname;
    uin.usedAt = existingResult.completedAt;
    uin.updatedAt = completedAt;
    return existingResult;
  }

  const sectionScores = calculateSessionSectionScores(store, session.id);
  const totalScore = sectionScores.reduce((sum, section) => sum + section.score, 0);
  const totalQuestions = sectionScores.reduce((sum, section) => sum + section.total, 0);
  const percentage = calculatePercentage(totalScore, totalQuestions);
  const result: TestResultRecord = {
    id: generateId(),
    sessionId: session.id,
    uinId: session.uinId,
    candidateName: session.candidateName,
    candidateSurname: session.candidateSurname,
    totalScore,
    totalQuestions,
    percentage,
    status: calculateResultStatus(percentage),
    academicYear: getAcademicYear(completedAt),
    completedAt,
    createdAt: completedAt,
  };

  store.results.push(result);

  sectionScores.forEach((section) => {
    store.resultSections.push({
      id: generateId(),
      resultId: result.id,
      subjectId: section.subjectId,
      subjectNameSnapshot: section.subjectNameSnapshot,
      score: section.score,
      total: section.total,
      createdAt: completedAt,
    });
  });

  session.status = 'COMPLETED';
  session.completedAt = completedAt;
  session.isOnSectionBreak = false;
  session.pendingSectionIndex = null;
  session.updatedAt = completedAt;

  uin.status = 'USED';
  uin.isUsed = true;
  uin.usedByName = session.candidateName;
  uin.usedBySurname = session.candidateSurname;
  uin.usedAt = completedAt;
  uin.updatedAt = completedAt;

  return result;
};

const getSessionConflictResponse = (
  store: DataStore,
  session: TestSessionRecord,
  message: string
): SessionMutationResponse => ({
  statusCode: 409,
  body: {
    message,
    session: toSessionResponse(store, session),
  },
});

router.post('/start', validate({ body: startSessionBodySchema }), async (req, res) => {
  const response = await mutateStore((store): SessionMutationResponse => {
    const requestedUin = req.body.uin.trim().toUpperCase();
    const requestedName = req.body.name.trim();
    const requestedSurname = req.body.surname.trim();
    const uin = store.uins.find((item) => item.code === requestedUin);

    if (!uin) {
      throw createHttpError(404, 'Invalid UIN code');
    }

    if (uin.status === 'VOID') {
      throw createHttpError(409, 'This UIN has been voided and cannot be used');
    }

    const activeSession = store.sessions.find(
      (item) => item.uinId === uin.id && item.status === 'ACTIVE'
    );

    if (activeSession) {
      const timingState = syncSessionTimingState(store, activeSession, nowIso());

      if (timingState === 'final-expired') {
        completeSession(store, activeSession, nowIso());
      }

      const sameCandidate =
        activeSession.candidateName.toLowerCase() === requestedName.toLowerCase() &&
        activeSession.candidateSurname.toLowerCase() === requestedSurname.toLowerCase();

      if (!sameCandidate) {
        return {
          statusCode: 409,
          body: {
            message: 'This UIN already belongs to another candidate session',
            session: toSessionResponse(store, activeSession),
          },
        };
      }

      return {
        statusCode: 200,
        body: {
          ...toSessionResponse(store, activeSession),
          resumed: true,
        },
      };
    }

    if (uin.isUsed || uin.status === 'USED') {
      throw createHttpError(409, 'This UIN has already been used');
    }

    if (uin.status === 'LOCKED') {
      throw createHttpError(
        409,
        'This UIN is already locked to a different in-progress session'
      );
    }

    const assignments = store.uinSubjects
      .filter((item) => item.uinId === uin.id)
      .sort((left, right) => left.orderIndex - right.orderIndex);

    if (assignments.length === 0) {
      throw createHttpError(409, 'This UIN has no assigned subjects');
    }

    const subjects = assignments.map((assignment) =>
      store.subjects.find(
        (subject) => subject.id === assignment.subjectId && subject.isActive
      )
    );

    if (subjects.some((subject) => !subject)) {
      throw createHttpError(409, 'One or more assigned subjects are missing or inactive');
    }

    const timestamp = nowIso();
    const sessionId = generateId();
    const session: TestSessionRecord = {
      id: sessionId,
      uinId: uin.id,
      candidateName: requestedName,
      candidateSurname: requestedSurname,
      status: 'ACTIVE',
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      pendingSectionIndex: null,
      isOnSectionBreak: false,
      startedAt: timestamp,
      currentSectionStartedAt: timestamp,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.sessions.push(session);

    subjects.forEach((subject, sectionOrder) => {
      if (!subject) {
        return;
      }

      if (subject.questionCount <= 0) {
        throw createHttpError(
          409,
          `${subject.name} does not have a positive question count configured`
        );
      }

      const activeQuestions = store.questions.filter(
        (question) => question.subjectId === subject.id && question.isActive
      );

      if (activeQuestions.length < subject.questionCount) {
        throw createHttpError(409, `Not enough active questions for ${subject.name}`, {
          available: activeQuestions.length,
          required: subject.questionCount,
          subjectId: subject.id,
          subjectName: subject.name,
        });
      }

      const orderedQuestions = [...activeQuestions].sort((left, right) => {
        if (left.createdAt !== right.createdAt) {
          return left.createdAt.localeCompare(right.createdAt);
        }

        return left.id.localeCompare(right.id);
      });
      const sessionSectionId = generateId();
      const selectedQuestions = store.settings.randomizeQuestionsForStudents
        ? shuffleWithSeed(
            orderedQuestions,
            `${requestedUin}-${sessionId}-${subject.id}`
          ).slice(0, subject.questionCount)
        : orderedQuestions.slice(0, subject.questionCount);

      store.sessionSections.push({
        id: sessionSectionId,
        sessionId,
        subjectId: subject.id,
        subjectNameSnapshot: subject.name,
        sectionOrder,
        timeLimitSeconds: subject.timeLimitSeconds,
        questionCount: subject.questionCount,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      selectedQuestions.forEach((question, questionOrder) => {
        store.sessionQuestions.push({
          id: generateId(),
          sessionId,
          sessionSectionId,
          questionId: question.id,
          subjectId: subject.id,
          sectionOrder,
          questionOrder,
          questionTextSnapshot: question.questionText,
          imageUrlSnapshot: question.imageUrl,
          optionASnapshot: question.optionA,
          optionBSnapshot: question.optionB,
          optionCSnapshot: question.optionC,
          optionDSnapshot: question.optionD,
          correctAnswerSnapshot: question.correctAnswer,
          createdAt: timestamp,
        });
      });
    });

    uin.status = 'LOCKED';
    uin.updatedAt = timestamp;

    return {
      statusCode: 201,
      body: {
        ...toSessionResponse(store, session),
        resumed: false,
      },
    };
  });

  res.status(response.statusCode).json(response.body);
});

router.get('/:sessionId', validate({ params: candidateSessionIdParamSchema }), async (req, res) => {
  const sessionId = getSingleParam(req.params.sessionId);
  const session = await mutateStore((store) => {
    const existingSession = getSessionOrThrow(store, sessionId);

    if (existingSession.status === 'ACTIVE') {
      const timingState = syncSessionTimingState(store, existingSession, nowIso());

      if (timingState === 'final-expired') {
        completeSession(store, existingSession, nowIso());
      }
    }

    return toSessionResponse(store, existingSession);
  });

  res.json(session);
});

router.patch(
  '/:sessionId/answers',
  validate({ params: candidateSessionIdParamSchema, body: answerBodySchema }),
  async (req, res) => {
    const sessionId = getSingleParam(req.params.sessionId);
    const response = await mutateStore((store): SessionMutationResponse => {
      const session = getSessionOrThrow(store, sessionId);

      if (session.status !== 'ACTIVE') {
        return getSessionConflictResponse(store, session, 'This session is no longer active');
      }

      const timingState = syncSessionTimingState(store, session, nowIso());

      if (timingState === 'final-expired') {
        completeSession(store, session, nowIso());
        return getSessionConflictResponse(
          store,
          session,
          'The section timer elapsed and the test was completed automatically'
        );
      }

      if (session.isOnSectionBreak || timingState === 'break') {
        return getSessionConflictResponse(
          store,
          session,
          'The current section has ended. Advance to the next section to continue'
        );
      }

      if (req.body.currentSection !== session.currentSectionIndex) {
        return getSessionConflictResponse(
          store,
          session,
          'Your client session is out of sync with the server state'
        );
      }

      const sessionQuestion = getSessionQuestion(store, session.id, req.body.sessionQuestionId);

      if (!sessionQuestion) {
        throw createHttpError(404, 'Session question not found');
      }

      if (sessionQuestion.sectionOrder !== session.currentSectionIndex) {
        return getSessionConflictResponse(
          store,
          session,
          'You can only save answers for questions in the current section'
        );
      }

      const sectionQuestions = getSessionQuestionsForSection(
        store,
        session.id,
        session.currentSectionIndex
      );
      const maxQuestionIndex = Math.max(0, sectionQuestions.length - 1);
      const completedSectionSentinelIndex = maxQuestionIndex + 1;

      if (req.body.currentQuestionIndex > completedSectionSentinelIndex) {
        throw createHttpError(400, 'Question index is outside the current section range');
      }

      const timestamp = nowIso();
      const existingAnswer = store.sessionAnswers.find(
        (item) =>
          item.sessionId === session.id &&
          item.sessionQuestionId === req.body.sessionQuestionId
      );

      if (existingAnswer) {
        existingAnswer.answer = req.body.answer;
        existingAnswer.savedAt = timestamp;
      } else {
        store.sessionAnswers.push({
          id: generateId(),
          sessionId: session.id,
          sessionQuestionId: req.body.sessionQuestionId,
          answer: req.body.answer,
          savedAt: timestamp,
        });
      }

      if (req.body.currentQuestionIndex === completedSectionSentinelIndex) {
        const nextSectionIndex = session.currentSectionIndex + 1;
        const hasNextSection = Boolean(
          getSessionSections(store, session.id).find(
            (section) => section.sectionOrder === nextSectionIndex
          )
        );

        session.currentQuestionIndex = maxQuestionIndex;
        session.updatedAt = timestamp;

        if (hasNextSection) {
          session.isOnSectionBreak = true;
          session.pendingSectionIndex = nextSectionIndex;
        }
      } else {
        session.currentQuestionIndex = req.body.currentQuestionIndex;
        session.updatedAt = timestamp;
      }

      return {
        statusCode: 200,
        body: toSessionResponse(store, session),
      };
    });

    res.status(response.statusCode).json(response.body);
  }
);

router.post(
  '/:sessionId/advance-section',
  validate({ params: candidateSessionIdParamSchema, body: advanceSectionBodySchema }),
  async (req, res) => {
    const sessionId = getSingleParam(req.params.sessionId);
    const response = await mutateStore((store): SessionMutationResponse => {
      const session = getSessionOrThrow(store, sessionId);

      if (session.status !== 'ACTIVE') {
        return getSessionConflictResponse(store, session, 'This session is no longer active');
      }

      const timingState = syncSessionTimingState(store, session, nowIso());

      if (timingState === 'final-expired') {
        completeSession(store, session, nowIso());
        return getSessionConflictResponse(
          store,
          session,
          'The last section timed out and the test was completed automatically'
        );
      }

      if (!session.isOnSectionBreak) {
        return getSessionConflictResponse(
          store,
          session,
          'The current section is still active and cannot be advanced yet'
        );
      }

      const expectedNextSectionIndex =
        session.pendingSectionIndex ?? session.currentSectionIndex + 1;

      if (req.body.nextSectionIndex !== expectedNextSectionIndex) {
        return getSessionConflictResponse(
          store,
          session,
          'Advance request does not match the next server-expected section'
        );
      }

      const nextSection = getSessionSections(store, session.id).find(
        (section) => section.sectionOrder === req.body.nextSectionIndex
      );

      if (!nextSection) {
        throw createHttpError(400, 'Requested next section does not exist');
      }

      const timestamp = nowIso();
      session.currentSectionIndex = nextSection.sectionOrder;
      session.pendingSectionIndex = null;
      session.isOnSectionBreak = false;
      session.currentQuestionIndex = 0;
      session.currentSectionStartedAt = timestamp;
      session.updatedAt = timestamp;

      return {
        statusCode: 200,
        body: toSessionResponse(store, session),
      };
    });

    res.status(response.statusCode).json(response.body);
  }
);

router.post(
  '/:sessionId/complete',
  validate({ params: candidateSessionIdParamSchema }),
  async (req, res) => {
    const sessionId = getSingleParam(req.params.sessionId);
    const result = await mutateStore((store) => {
      const session = getSessionOrThrow(store, sessionId);
      const completedResult = completeSession(store, session, nowIso());
      return toResultResponse(store, completedResult);
    });

    res.json(result);
  }
);

export default router;
