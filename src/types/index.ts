export type Section = string;

export type SectionTimeLimits = Record<Section, number>;
export type SectionQuestionCounts = Record<Section, number>;

export interface SubjectConfig {
  id: string;
  name: string;
  minutes: number;
  questions: number;
}

export interface Question {
  id: string;
  section: Section;
  question: string;
  imageUrl?: string;
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
  // Optional subject settings assigned when generating this UIN
  subjectCount?: number;
  subjects?: string[];
}

export interface TestSession {
  uin: string;
  name: string;
  surname: string;
  currentSection: number;
  pendingSectionIndex?: number | null;
  isOnSectionBreak?: boolean;
  currentQuestionIndex: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  selectedQuestions?: Question[];
  selectedQuestionIds?: string[];
  selectedSections: string[];
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
  academicYear: string;
}

export interface StorageData {
  questions: Question[];
  uins: UIN[];
  results: TestResult[];
  sectionTimeLimits: SectionTimeLimits;
  sectionQuestionCounts: SectionQuestionCounts;
  subjectConfigs: SubjectConfig[];
  currentSession: TestSession | null;
  // bump when seed data structure changes
  version?: number;
}
