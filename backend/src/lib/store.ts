import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { resolveFromProjectRoot } from '../config/paths.js';

export type AdminRole = 'SUPER_ADMIN' | 'STAFF';
export type UINStatus = 'AVAILABLE' | 'LOCKED' | 'USED' | 'VOID';
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
export type ResultStatus = 'PASS' | 'FAIL';
export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface AdminRecord {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectRecord {
  id: string;
  name: string;
  timeLimitSeconds: number;
  questionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRecord {
  id: string;
  subjectId: string;
  questionText: string;
  imageUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UINRecord {
  id: string;
  code: string;
  status: UINStatus;
  isUsed: boolean;
  usedByName: string | null;
  usedBySurname: string | null;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UINSubjectRecord {
  id: string;
  uinId: string;
  subjectId: string;
  orderIndex: number;
  createdAt: string;
}

export interface TestSessionRecord {
  id: string;
  uinId: string;
  candidateName: string;
  candidateSurname: string;
  status: SessionStatus;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  pendingSectionIndex: number | null;
  isOnSectionBreak: boolean;
  startedAt: string;
  currentSectionStartedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestSessionSectionRecord {
  id: string;
  sessionId: string;
  subjectId: string;
  subjectNameSnapshot: string;
  sectionOrder: number;
  timeLimitSeconds: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestSessionQuestionRecord {
  id: string;
  sessionId: string;
  sessionSectionId: string;
  questionId: string;
  subjectId: string;
  sectionOrder: number;
  questionOrder: number;
  questionTextSnapshot: string;
  imageUrlSnapshot: string | null;
  optionASnapshot: string;
  optionBSnapshot: string;
  optionCSnapshot: string;
  optionDSnapshot: string;
  correctAnswerSnapshot: AnswerOption;
  createdAt: string;
}

export interface TestSessionAnswerRecord {
  id: string;
  sessionId: string;
  sessionQuestionId: string;
  answer: AnswerOption;
  savedAt: string;
}

export interface TestResultRecord {
  id: string;
  sessionId: string;
  uinId: string;
  candidateName: string;
  candidateSurname: string;
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  status: ResultStatus;
  academicYear: string;
  completedAt: string;
  createdAt: string;
}

export interface TestResultSectionRecord {
  id: string;
  resultId: string;
  subjectId: string;
  subjectNameSnapshot: string;
  score: number;
  total: number;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: unknown;
  createdAt: string;
}

export interface DataStore {
  meta: {
    version: number;
  };
  admins: AdminRecord[];
  subjects: SubjectRecord[];
  questions: QuestionRecord[];
  uins: UINRecord[];
  uinSubjects: UINSubjectRecord[];
  sessions: TestSessionRecord[];
  sessionSections: TestSessionSectionRecord[];
  sessionQuestions: TestSessionQuestionRecord[];
  sessionAnswers: TestSessionAnswerRecord[];
  results: TestResultRecord[];
  resultSections: TestResultSectionRecord[];
  auditLogs: AuditLogRecord[];
}

const STORE_VERSION = 1;
const dataDirectory = resolveFromProjectRoot(env.DATA_DIR);
const storeFilePath = path.join(dataDirectory, 'store.json');

let storePromise: Promise<DataStore> | null = null;
let writeQueue = Promise.resolve();

const createEmptyStore = (): DataStore => ({
  meta: {
    version: STORE_VERSION,
  },
  admins: [],
  subjects: [],
  questions: [],
  uins: [],
  uinSubjects: [],
  sessions: [],
  sessionSections: [],
  sessionQuestions: [],
  sessionAnswers: [],
  results: [],
  resultSections: [],
  auditLogs: [],
});

const normalizeStore = (value: Partial<DataStore> | undefined): DataStore => ({
  meta: {
    version: value?.meta?.version ?? STORE_VERSION,
  },
  admins: value?.admins ?? [],
  subjects: value?.subjects ?? [],
  questions: value?.questions ?? [],
  uins: value?.uins ?? [],
  uinSubjects: value?.uinSubjects ?? [],
  sessions: value?.sessions ?? [],
  sessionSections: value?.sessionSections ?? [],
  sessionQuestions: value?.sessionQuestions ?? [],
  sessionAnswers: value?.sessionAnswers ?? [],
  results: value?.results ?? [],
  resultSections: value?.resultSections ?? [],
  auditLogs: value?.auditLogs ?? [],
});

const persistStore = async (store: DataStore) => {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(storeFilePath, JSON.stringify(store, null, 2), 'utf8');
};

const seedAdminIfNeeded = async (store: DataStore) => {
  if (store.admins.length > 0) {
    return;
  }

  const timestamp = new Date().toISOString();
  const passwordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 10);

  store.admins.push({
    id: randomUUID(),
    username: env.ADMIN_SEED_USERNAME,
    name: 'System Admin',
    passwordHash,
    role: 'SUPER_ADMIN',
    lastLoginAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
};

const loadStore = async (): Promise<DataStore> => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    const raw = await fs.readFile(storeFilePath, 'utf8');
    const parsed = normalizeStore(JSON.parse(raw) as Partial<DataStore>);
    await seedAdminIfNeeded(parsed);
    await persistStore(parsed);
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }

    const store = createEmptyStore();
    await seedAdminIfNeeded(store);
    await persistStore(store);
    return store;
  }
};

const getStore = async () => {
  if (!storePromise) {
    storePromise = loadStore();
  }

  return storePromise;
};

export const generateId = () => randomUUID();
export const nowIso = () => new Date().toISOString();

export const readStore = async <T>(reader: (store: DataStore) => T | Promise<T>): Promise<T> => {
  const store = await getStore();
  return reader(store);
};

export const mutateStore = async <T>(
  mutator: (store: DataStore) => T | Promise<T>
): Promise<T> => {
  const task = writeQueue.then(async () => {
    const store = await getStore();
    const result = await mutator(store);
    await persistStore(store);
    return result;
  });

  writeQueue = task.then(
    () => undefined,
    () => undefined
  );

  return task;
};

export const addAuditLog = (
  store: DataStore,
  entry: Omit<AuditLogRecord, 'id' | 'createdAt'>
) => {
  store.auditLogs.push({
    id: generateId(),
    createdAt: nowIso(),
    ...entry,
  });
};
