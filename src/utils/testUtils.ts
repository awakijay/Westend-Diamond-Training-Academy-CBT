import type { Question, SessionQuestion, Section, SectionQuestionCounts, TestSession } from '../types';

export const getQuestionNumberInSection = (
  allQuestions: Question[],
  question: Pick<Question, 'id' | 'section'>
): number => {
  const sectionQuestions = allQuestions.filter((item) => item.section === question.section);
  const position = sectionQuestions.findIndex((item) => item.id === question.id);
  return position >= 0 ? position + 1 : sectionQuestions.length + 1;
};

export const getSelectedQuestions = (session: TestSession): SessionQuestion[] => {
  if (session.selectedQuestions?.length) {
    return session.selectedQuestions;
  }

  return session.questions ?? [];
};

export const getQuestionsForSection = (
  session: TestSession,
  sectionIndex: number
): SessionQuestion[] => {
  const section = session.selectedSections[sectionIndex];
  return getSelectedQuestions(session).filter((question) => question.section === section);
};

export const getTotalConfiguredQuestions = (
  sectionQuestionCounts: SectionQuestionCounts
): number => Object.values(sectionQuestionCounts).reduce((sum, value) => sum + (value || 0), 0);

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const groupQuestionsBySection = (questions: Question[]) =>
  questions.reduce(
    (acc, question) => {
      acc[question.section] = [...(acc[question.section] ?? []), question];
      return acc;
    },
    {} as Record<Section, Question[]>
  );
