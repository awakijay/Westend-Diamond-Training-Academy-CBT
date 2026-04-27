export type Section = string;
export type AnswerOption = 'A' | 'B' | 'C' | 'D';
export type SectionTimeLimits = Record<Section, number>;
export type SectionQuestionCounts = Record<Section, number>;

export interface AdminProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  lastLoginAt: string | null;
}

export interface AdminExamSettings {
  randomizeQuestionsForStudents: boolean;
}

export interface SubjectConfig {
  id: string;
  name: string;
  timeLimitSeconds: number;
  minutes: number;
  questionCount: number;
  questionBankCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  subjectId: string;
  subjectName?: string | null;
  section: Section;
  question: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UINSubject {
  id: string;
  name: string;
}

export interface UIN {
  id: string;
  code: string;
  status: 'AVAILABLE' | 'LOCKED' | 'USED' | 'VOID';
  used: boolean;
  isUsed: boolean;
  usedBy?: string | null;
  usedByName?: string | null;
  usedBySurname?: string | null;
  usedAt?: string | null;
  createdAt: string;
  subjectCount: number;
  subjectNames: string[];
  subjects: UINSubject[];
}

export interface SessionQuestion {
  id: string;
  sessionQuestionId: string;
  questionId: string;
  subjectId: string;
  sectionOrder: number;
  questionOrder: number;
  section: Section;
  question: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface SessionSection {
  id: string;
  name: string;
  sectionOrder: number;
  timeLimitSeconds: number;
  questionCount: number;
}

export interface SectionResult {
  subjectId?: string;
  section: Section;
  score: number;
  total: number;
  percentage?: number;
}

export interface ResultAnswerReviewItem {
  id: string;
  sessionQuestionId: string;
  questionId: string;
  subjectId: string;
  section: Section;
  sectionOrder: number;
  questionOrder: number;
  question: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedAnswer: AnswerOption | null;
  correctAnswer: AnswerOption;
  isAnswered: boolean;
  isCorrect: boolean;
}

export interface TestResult {
  id: string;
  resultId: string;
  sessionId: string;
  uin: string;
  name: string;
  surname: string;
  sectionResults: SectionResult[];
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  status: 'Pass' | 'Fail';
  completedAt: string;
  academicYear: string;
  answerReview?: ResultAnswerReviewItem[];
}

export interface TestSession {
  sessionId: string;
  resultId: string | null;
  result: TestResult | null;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  candidate: {
    name: string;
    surname: string;
    uin: string | null;
  };
  uin: string | null;
  name: string;
  surname: string;
  currentSection: number;
  pendingSectionIndex: number | null;
  isOnSectionBreak: boolean;
  currentQuestionIndex: number;
  selectedSections: string[];
  sections: SessionSection[];
  sectionTimeLimits: SectionTimeLimits;
  sectionQuestionCounts: SectionQuestionCounts;
  questions: SessionQuestion[];
  selectedQuestions: SessionQuestion[];
  selectedQuestionIds: string[];
  answers: Record<string, AnswerOption>;
  startTime: string;
  sectionStartTime: string;
  currentSectionRemainingTimeSeconds: number;
  completedAt: string | null;
  resumed?: boolean;
}

export interface AcademicYearAnalytics {
  academicYear: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  averageScore: number;
}

export interface QuestionResponseRespondent {
  resultId: string;
  sessionId: string;
  name: string;
  surname: string;
  fullName: string;
  uin: string | null;
  completedAt: string;
  selectedAnswer: AnswerOption | null;
  isCorrect: boolean;
}

export interface QuestionResponseOptionBreakdown {
  option: AnswerOption | 'UNANSWERED';
  label: string;
  count: number;
  isCorrectOption: boolean;
  respondents: QuestionResponseRespondent[];
}

export interface QuestionResponseAnalyticsItem {
  questionId: string;
  subjectId: string;
  subjectName: string;
  question: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  totalResponses: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  correctRate: number;
  optionBreakdown: QuestionResponseOptionBreakdown[];
  correctRespondents: QuestionResponseRespondent[];
  incorrectRespondents: QuestionResponseRespondent[];
  unansweredRespondents: QuestionResponseRespondent[];
}

export interface QuestionResponseAnalyticsSummary {
  questionsCovered: number;
  totalResponses: number;
  answeredResponses: number;
  correctResponses: number;
  incorrectResponses: number;
  unansweredResponses: number;
}

export interface QuestionResponseAnalyticsResponse {
  items: QuestionResponseAnalyticsItem[];
  summary: QuestionResponseAnalyticsSummary;
}

export interface RestoreDefaultSummary {
  auditLogsCleared: number;
  questionsCleared: number;
  resultsCleared: number;
  sessionsCleared: number;
  subjectsCleared: number;
  uinsCleared: number;
  uploadFilesCleared: number;
}

export interface RestoreDefaultResponse {
  dataVersion: string;
  message: string;
  summary: RestoreDefaultSummary;
  warning: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
