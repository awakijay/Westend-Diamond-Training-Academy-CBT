import { Question, UIN } from '../types';
import {
  STORAGE_VERSION,
  getStorageData,
  setStorageData,
  DEFAULT_SUBJECT_CONFIGS,
  DEFAULT_SECTION_TIME_LIMITS,
  DEFAULT_SECTION_QUESTION_COUNTS,
} from './storage';

// Production seed: keep everything empty by default.
export const mockQuestions: Question[] = [];
export const mockUINs: UIN[] = [];

export const initializeMockData = () => {
  const existingData = localStorage.getItem('westend_diamond_academy_cbt');
  if (!existingData) {
    const initialData = {
      questions: [],
      uins: [],
      results: [],
      currentSession: null,
      subjectConfigs: DEFAULT_SUBJECT_CONFIGS,
      sectionTimeLimits: DEFAULT_SECTION_TIME_LIMITS,
      sectionQuestionCounts: DEFAULT_SECTION_QUESTION_COUNTS,
      version: STORAGE_VERSION,
    };
    localStorage.setItem('westend_diamond_academy_cbt', JSON.stringify(initialData));
    return;
  }

  try {
    const parsed = JSON.parse(existingData) as any;
    if (parsed.version !== STORAGE_VERSION) {
      const current = getStorageData();
      setStorageData({
        ...current,
        questions: [],
        uins: [],
        results: [],
        currentSession: null,
        version: STORAGE_VERSION,
      });
    }
  } catch {
    localStorage.removeItem('westend_diamond_academy_cbt');
    initializeMockData();
  }
};
