import { Question, Section, TestSession, SectionResult, SectionQuestionCounts } from '../types';

export const SECTIONS: Section[] = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'General Knowledge',
];

export const getSections = (): Section[] => SECTIONS;

export const getQuestionNumberInSection = (
  allQuestions: Question[],
  question: Pick<Question, 'id' | 'section'>
): number => {
  const sectionQuestions = allQuestions.filter((item) => item.section === question.section);
  const position = sectionQuestions.findIndex((item) => item.id === question.id);
  return position >= 0 ? position + 1 : sectionQuestions.length + 1;
};

const hashString = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seedValue: string) => {
  let seed = hashString(seedValue) || 1;

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
};

const shuffleWithSeed = <T,>(items: T[], seed: string): T[] => {
  const random = createSeededRandom(seed);
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
};

export const generateTestQuestions = (
  allQuestions: Question[],
  sectionQuestionCounts: SectionQuestionCounts,
  uinSeed: string
): Question[] => {
  const selectedQuestions: Question[] = [];

  SECTIONS.forEach((section) => {
    const sectionQuestions = allQuestions.filter((question) => question.section === section);
    const shuffledQuestions = shuffleWithSeed(sectionQuestions, `${uinSeed}-${section}`);
    const count = sectionQuestionCounts[section];
    selectedQuestions.push(...shuffledQuestions.slice(0, count));
  });

  return selectedQuestions;
};

export const calculateSectionResults = (
  session: TestSession
): SectionResult[] => {
  return SECTIONS.map((section) => {
    const sectionQuestions = session.selectedQuestions.filter(
      (question) => question.section === section
    );

    const score = sectionQuestions.reduce((correctCount, question) => {
      const userAnswer = session.answers[question.id];
      return userAnswer === question.correctAnswer ? correctCount + 1 : correctCount;
    }, 0);

    return {
      section,
      score,
      total: sectionQuestions.length,
    };
  });
};

export const calculateTotalScore = (sectionResults: SectionResult[]): number => {
  return sectionResults.reduce((sum, result) => sum + result.score, 0);
};

export const getQuestionsForSection = (
  session: TestSession,
  sectionIndex: number
): Question[] => {
  const section = SECTIONS[sectionIndex];
  return session.selectedQuestions.filter((question) => question.section === section);
};

export const getTotalConfiguredQuestions = (
  sectionQuestionCounts: SectionQuestionCounts
): number => {
  return SECTIONS.reduce((sum, section) => sum + sectionQuestionCounts[section], 0);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
