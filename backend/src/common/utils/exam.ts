import { PASS_MARK_PERCENTAGE } from '../../config/constants.js';
import type {
  AnswerOption,
  DataStore,
  ResultStatus,
  TestSessionRecord,
  TestSessionQuestionRecord,
  TestSessionSectionRecord,
} from '../../lib/store.js';

export const getAcademicYear = (dateInput: string | Date): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

export const calculatePercentage = (score: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return Number(((score / total) * 100).toFixed(2));
};

export const calculateResultStatus = (percentage: number): ResultStatus =>
  percentage >= PASS_MARK_PERCENTAGE ? 'PASS' : 'FAIL';

export const calculateRemainingTimeSeconds = (
  sectionStartedAt: string,
  timeLimitSeconds: number
): number => {
  const elapsedMs = Date.now() - new Date(sectionStartedAt).getTime();
  const remaining = timeLimitSeconds - Math.floor(elapsedMs / 1000);

  return remaining > 0 ? remaining : 0;
};

export const getSessionSections = (store: DataStore, sessionId: string) =>
  store.sessionSections
    .filter((section) => section.sessionId === sessionId)
    .sort((left, right) => left.sectionOrder - right.sectionOrder);

export const getSessionQuestions = (store: DataStore, sessionId: string) =>
  store.sessionQuestions
    .filter((question) => question.sessionId === sessionId)
    .sort((left, right) => {
      if (left.sectionOrder !== right.sectionOrder) {
        return left.sectionOrder - right.sectionOrder;
      }

      return left.questionOrder - right.questionOrder;
    });

export const getSessionQuestion = (
  store: DataStore,
  sessionId: string,
  sessionQuestionId: string
): TestSessionQuestionRecord | undefined =>
  store.sessionQuestions.find(
    (question) => question.sessionId === sessionId && question.id === sessionQuestionId
  );

export const getSessionQuestionsForSection = (
  store: DataStore,
  sessionId: string,
  sectionOrder: number
) =>
  getSessionQuestions(store, sessionId).filter(
    (question) => question.sectionOrder === sectionOrder
  );

export const getCurrentSessionSection = (
  store: DataStore,
  session: TestSessionRecord
): TestSessionSectionRecord | undefined =>
  getSessionSections(store, session.id).find(
    (section) => section.sectionOrder === session.currentSectionIndex
  );

export const getAnswerMap = (
  store: DataStore,
  sessionId: string
): Record<string, AnswerOption> =>
  Object.fromEntries(
    store.sessionAnswers
      .filter((answer) => answer.sessionId === sessionId)
      .map((answer) => [answer.sessionQuestionId, answer.answer])
  );

export const calculateSessionSectionScores = (store: DataStore, sessionId: string) => {
  const answersBySessionQuestionId = new Map(
    store.sessionAnswers
      .filter((answer) => answer.sessionId === sessionId)
      .map((answer) => [answer.sessionQuestionId, answer.answer])
  );

  return getSessionSections(store, sessionId).map((section) => {
    const sectionQuestions = getSessionQuestionsForSection(
      store,
      sessionId,
      section.sectionOrder
    );
    const score = sectionQuestions.reduce((total, question) => {
      const answer = answersBySessionQuestionId.get(question.id);
      return answer === question.correctAnswerSnapshot ? total + 1 : total;
    }, 0);

    return {
      subjectId: section.subjectId,
      subjectNameSnapshot: section.subjectNameSnapshot,
      score,
      total: sectionQuestions.length,
    };
  });
};

export const syncSessionTimingState = (
  store: DataStore,
  session: TestSessionRecord,
  nowIso: string
): 'active' | 'break' | 'final-expired' => {
  if (session.status !== 'ACTIVE') {
    return 'active';
  }

  const sections = getSessionSections(store, session.id);
  const currentSection = sections.find(
    (section) => section.sectionOrder === session.currentSectionIndex
  );

  if (!currentSection) {
    return 'active';
  }

  const remainingTimeSeconds = calculateRemainingTimeSeconds(
    session.currentSectionStartedAt,
    currentSection.timeLimitSeconds
  );

  if (remainingTimeSeconds > 0) {
    return 'active';
  }

  if (session.currentSectionIndex < sections.length - 1) {
    session.isOnSectionBreak = true;
    session.pendingSectionIndex = session.currentSectionIndex + 1;
    session.updatedAt = nowIso;
    return 'break';
  }

  return 'final-expired';
};
