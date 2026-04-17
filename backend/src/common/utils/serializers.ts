import {
  calculatePercentage,
  calculateRemainingTimeSeconds,
  getAnswerMap,
  getCurrentSessionSection,
  getSessionSections,
} from './exam.js';
import type {
  AdminRecord,
  DataStore,
  QuestionRecord,
  SubjectRecord,
  TestResultRecord,
  TestSessionRecord,
  UINRecord,
} from '../../lib/store.js';

export const toAdminResponse = (admin: AdminRecord) => ({
  id: admin.id,
  username: admin.username,
  name: admin.name,
  role: admin.role,
  lastLoginAt: admin.lastLoginAt,
});

export const toSubjectResponse = (store: DataStore, subject: SubjectRecord) => ({
  id: subject.id,
  name: subject.name,
  timeLimitSeconds: subject.timeLimitSeconds,
  minutes: Number((subject.timeLimitSeconds / 60).toFixed(2)),
  questionCount: subject.questionCount,
  questionBankCount: store.questions.filter(
    (question) => question.subjectId === subject.id && question.isActive
  ).length,
  isActive: subject.isActive,
  createdAt: subject.createdAt,
  updatedAt: subject.updatedAt,
});

export const toQuestionResponse = (store: DataStore, question: QuestionRecord) => {
  const subject = store.subjects.find((item) => item.id === question.subjectId);

  return {
    id: question.id,
    subjectId: question.subjectId,
    subjectName: subject?.name ?? null,
    section: subject?.name ?? null,
    question: question.questionText,
    imageUrl: question.imageUrl,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer: question.correctAnswer,
    isActive: question.isActive,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
};

export const toUinResponse = (store: DataStore, uin: UINRecord) => {
  const assignments = store.uinSubjects
    .filter((assignment) => assignment.uinId === uin.id)
    .sort((left, right) => left.orderIndex - right.orderIndex);

  const subjects = assignments
    .map((assignment) => store.subjects.find((subject) => subject.id === assignment.subjectId))
    .filter((subject): subject is SubjectRecord => Boolean(subject))
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
    }));

  return {
    id: uin.id,
    code: uin.code,
    status: uin.status,
    used: uin.isUsed,
    isUsed: uin.isUsed,
    usedBy: [uin.usedByName, uin.usedBySurname].filter(Boolean).join(' ') || null,
    usedByName: uin.usedByName,
    usedBySurname: uin.usedBySurname,
    usedAt: uin.usedAt,
    createdAt: uin.createdAt,
    subjectCount: subjects.length,
    subjectNames: subjects.map((subject) => subject.name),
    subjects,
  };
};

export const toSessionResponse = (store: DataStore, session: TestSessionRecord) => {
  const uin = store.uins.find((item) => item.id === session.uinId);
  const result = store.results.find((item) => item.sessionId === session.id);
  const sections = getSessionSections(store, session.id);
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const questions = store.sessionQuestions
    .filter((question) => question.sessionId === session.id)
    .sort((left, right) => {
      if (left.sectionOrder !== right.sectionOrder) {
        return left.sectionOrder - right.sectionOrder;
      }

      return left.questionOrder - right.questionOrder;
    })
    .map((question) => {
      const section = sectionMap.get(question.sessionSectionId);

      return {
        id: question.id,
        sessionQuestionId: question.id,
        questionId: question.questionId,
        subjectId: question.subjectId,
        sectionOrder: question.sectionOrder,
        questionOrder: question.questionOrder,
        section: section?.subjectNameSnapshot ?? null,
        question: question.questionTextSnapshot,
        imageUrl: question.imageUrlSnapshot,
        optionA: question.optionASnapshot,
        optionB: question.optionBSnapshot,
        optionC: question.optionCSnapshot,
        optionD: question.optionDSnapshot,
      };
    });

  const currentSection = getCurrentSessionSection(store, session);
  const currentSectionRemainingTimeSeconds = currentSection
    ? calculateRemainingTimeSeconds(
        session.currentSectionStartedAt,
        currentSection.timeLimitSeconds
      )
    : 0;

  return {
    sessionId: session.id,
    resultId: result?.id ?? null,
    result: result ? toResultResponse(store, result) : null,
    status: session.status,
    candidate: {
      name: session.candidateName,
      surname: session.candidateSurname,
      uin: uin?.code ?? null,
    },
    uin: uin?.code ?? null,
    name: session.candidateName,
    surname: session.candidateSurname,
    currentSection: session.currentSectionIndex,
    pendingSectionIndex: session.pendingSectionIndex,
    isOnSectionBreak: session.isOnSectionBreak,
    currentQuestionIndex: session.currentQuestionIndex,
    selectedSections: sections.map((section) => section.subjectNameSnapshot),
    sections: sections.map((section) => ({
      id: section.subjectId,
      name: section.subjectNameSnapshot,
      sectionOrder: section.sectionOrder,
      timeLimitSeconds: section.timeLimitSeconds,
      questionCount: section.questionCount,
    })),
    sectionTimeLimits: Object.fromEntries(
      sections.map((section) => [section.subjectNameSnapshot, section.timeLimitSeconds])
    ),
    sectionQuestionCounts: Object.fromEntries(
      sections.map((section) => [section.subjectNameSnapshot, section.questionCount])
    ),
    questions,
    selectedQuestions: questions,
    selectedQuestionIds: questions.map((question) => question.id),
    answers: getAnswerMap(store, session.id),
    startTime: session.startedAt,
    sectionStartTime: session.currentSectionStartedAt,
    currentSectionRemainingTimeSeconds,
    completedAt: session.completedAt,
  };
};

export const toResultResponse = (store: DataStore, result: TestResultRecord) => {
  const uin = store.uins.find((item) => item.id === result.uinId);
  const sections = store.resultSections
    .filter((section) => section.resultId === result.id)
    .map((section) => ({
      subjectId: section.subjectId,
      section: section.subjectNameSnapshot,
      score: section.score,
      total: section.total,
      percentage: calculatePercentage(section.score, section.total),
    }));

  return {
    id: result.id,
    resultId: result.id,
    sessionId: result.sessionId,
    uin: uin?.code ?? null,
    name: result.candidateName,
    surname: result.candidateSurname,
    sectionResults: sections,
    totalScore: result.totalScore,
    totalQuestions: result.totalQuestions,
    percentage: result.percentage,
    status: result.status === 'PASS' ? 'Pass' : 'Fail',
    completedAt: result.completedAt,
    academicYear: result.academicYear,
  };
};
