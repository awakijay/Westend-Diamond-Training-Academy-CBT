export type Section =
  | 'Mathematics'
  | 'English'
  | 'Science'
  | 'Social Studies'
  | 'General Knowledge';

export type SectionTimeLimits = Record<Section, number>;
export type SectionQuestionCounts = Record<Section, number>;

export interface Question {
  id: string;
  section: Section;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface UIN {
  id: string;
  code: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
}

export interface TestSession {
  uin: string;
  name: string;
  surname: string;
  currentSection: number;
  currentQuestionIndex: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  selectedQuestions: Question[];
  sectionTimeLimits: SectionTimeLimits;
  sectionQuestionCounts: SectionQuestionCounts;
  startTime: string;
  sectionStartTime: string;
}

export interface SectionResult {
  section: Section;
  score: number;
  total: number;
}

export interface TestResult {
  id: string;
  uin: string;
  name: string;
  surname: string;
  sectionResults: SectionResult[];
  totalScore: number;
  totalQuestions: number;
  completedAt: string;
}

export interface StorageData {
  questions: Question[];
  uins: UIN[];
  results: TestResult[];
  sectionTimeLimits: SectionTimeLimits;
  sectionQuestionCounts: SectionQuestionCounts;
  currentSession: TestSession | null;
}
