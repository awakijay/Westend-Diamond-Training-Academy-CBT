import {
  StorageData,
  Question,
  UIN,
  TestResult,
  TestSession,
  SectionTimeLimits,
  SectionQuestionCounts,
} from '../types';

export const STORAGE_KEY = 'westend_diamond_academy_cbt';
export const STORAGE_VERSION = 5;

const cleanQuestionsForSubjects = (
  questions: StorageData['questions'],
  subjectConfigs: StorageData['subjectConfigs']
) => {
  const allowed = new Set(subjectConfigs.map((s) => s.name));
  return questions.filter((q) => allowed.has(q.section));
};

const notifyStorageUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cbt-storage-updated'));
  }
};
export const DEFAULT_SECTION_TIME_LIMITS: SectionTimeLimits = {};
export const DEFAULT_SECTION_QUESTION_COUNTS: SectionQuestionCounts = {};

export const DEFAULT_SUBJECT_CONFIGS: { id: string; name: string; minutes: number; questions: number }[] = [];

const normalizeSectionTimeLimits = (
  timeLimits?: Partial<SectionTimeLimits> | null
): SectionTimeLimits => ({
  ...DEFAULT_SECTION_TIME_LIMITS,
  ...timeLimits,
});

const normalizeSectionQuestionCounts = (
  questionCounts?: Partial<SectionQuestionCounts> | null
): SectionQuestionCounts => ({
  ...DEFAULT_SECTION_QUESTION_COUNTS,
  ...questionCounts,
});

export const getStorageData = (): StorageData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data) as Partial<StorageData>;
    const subjectConfigs = parsed.subjectConfigs ?? DEFAULT_SUBJECT_CONFIGS;
    const cleanedQuestions = cleanQuestionsForSubjects(parsed.questions ?? [], subjectConfigs);

    const base: StorageData = {
      questions: cleanedQuestions,
      uins: parsed.uins ?? [],
      results: parsed.results ?? [],
      subjectConfigs,
      sectionTimeLimits: normalizeSectionTimeLimits(parsed.sectionTimeLimits),
      sectionQuestionCounts: normalizeSectionQuestionCounts(parsed.sectionQuestionCounts),
      currentSession: parsed.currentSession
        ? {
            ...parsed.currentSession,
            sectionTimeLimits: normalizeSectionTimeLimits(
              parsed.currentSession.sectionTimeLimits
            ),
            sectionQuestionCounts: normalizeSectionQuestionCounts(
              parsed.currentSession.sectionQuestionCounts
            ),
          }
        : null,
      version: parsed.version ?? 1,
    };

    // On version bump, start clean (no demo seed)
    if (base.version !== STORAGE_VERSION) {
      return {
        ...base,
        questions: [],
        uins: [],
        results: [],
        currentSession: null,
        version: STORAGE_VERSION,
      };
    }

    return base;
  }
  return {
    questions: [],
    uins: [],
    results: [],
    subjectConfigs: DEFAULT_SUBJECT_CONFIGS,
    sectionTimeLimits: DEFAULT_SECTION_TIME_LIMITS,
    sectionQuestionCounts: DEFAULT_SECTION_QUESTION_COUNTS,
    currentSession: null,
    version: STORAGE_VERSION,
  };
};

export const setStorageData = (data: StorageData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: STORAGE_VERSION }));
  notifyStorageUpdate();
};

export const getQuestions = (): Question[] => {
  return getStorageData().questions;
};

export const setQuestions = (questions: Question[]): void => {
  const data = getStorageData();
  data.questions = questions;
  setStorageData(data);
};

export const getUINs = (): UIN[] => {
  return getStorageData().uins;
};

export const setUINs = (uins: UIN[]): void => {
  const data = getStorageData();
  data.uins = uins;
  setStorageData(data);
};

export const getResults = (): TestResult[] => {
  return getStorageData().results;
};

export const addResult = (result: TestResult): void => {
  const data = getStorageData();
  data.results.push(result);
  setStorageData(data);
};

export const getCurrentSession = (): TestSession | null => {
  return getStorageData().currentSession;
};

export const setCurrentSession = (session: TestSession | null): void => {
  const data = getStorageData();
  data.currentSession = session;
  setStorageData(data);
};

export const validateUIN = (code: string): UIN | null => {
  const uins = getUINs();
  const uin = uins.find((u) => u.code === code && !u.used);
  return uin || null;
};

export const getSectionTimeLimits = (): SectionTimeLimits => {
  return getStorageData().sectionTimeLimits;
};

export const setSectionTimeLimits = (sectionTimeLimits: SectionTimeLimits): void => {
  const data = getStorageData();
  data.sectionTimeLimits = normalizeSectionTimeLimits(sectionTimeLimits);
  setStorageData(data);
};

export const getSectionQuestionCounts = (): SectionQuestionCounts => {
  return getStorageData().sectionQuestionCounts;
};

export const setSectionQuestionCounts = (
  sectionQuestionCounts: SectionQuestionCounts
): void => {
  const data = getStorageData();
  data.sectionQuestionCounts = normalizeSectionQuestionCounts(sectionQuestionCounts);
  setStorageData(data);
};

export const getSubjectConfigs = () => {
  return getStorageData().subjectConfigs;
};

export const getSubjectNames = (): string[] => {
  return getSubjectConfigs().map((subject) => subject.name);
};

export const setSubjectConfigs = (subjectConfigs: {id:string;name:string;minutes:number;questions:number;}[]): void => {
  const data = getStorageData();
  data.subjectConfigs = subjectConfigs;
  setStorageData(data);
};

export const markUINAsUsed = (code: string, name: string, surname: string): void => {
  const uins = getUINs();
  const uin = uins.find((u) => u.code === code);
  if (uin) {
    uin.used = true;
    uin.usedBy = `${name} ${surname}`;
    uin.usedAt = new Date().toISOString();
    setUINs(uins);
  }
};

export const generateUINCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TRN-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const addUIN = (uin: UIN): void => {
  const uins = getUINs();
  uins.push(uin);
  setUINs(uins);
};

export const deleteUIN = (id: string): void => {
  const uins = getUINs();
  const filtered = uins.filter((u) => u.id !== id);
  setUINs(filtered);
};
