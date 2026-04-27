import type {
  AcademicYearAnalytics,
  AdminExamSettings,
  AdminProfile,
  QuestionResponseAnalyticsResponse,
  Question,
  RestoreDefaultResponse,
  SubjectConfig,
  TestResult,
  TestSession,
  UIN,
} from '../types';
import { getAdminToken } from './clientState';

type RequestOptions = {
  auth?: boolean;
  body?: BodyInit | null | object;
  headers?: HeadersInit;
  method?: string;
};

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = (configuredBaseUrl || 'http://localhost:4000/api').replace(/\/$/, '');
const API_ORIGIN = new URL(API_BASE_URL).origin;

const rewriteLocalUploadUrl = (value: string) => {
  try {
    const url = new URL(value);

    if (
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
      url.pathname.startsWith('/uploads/')
    ) {
      return new URL(`${url.pathname}${url.search}${url.hash}`, API_ORIGIN).toString();
    }
  } catch {
    return value;
  }

  return value;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const toAssetUrl = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return rewriteLocalUploadUrl(value);
  }

  return new URL(value, API_ORIGIN).toString();
};

const mapQuestion = (question: any): Question => ({
  ...question,
  imageUrl: toAssetUrl(question.imageUrl),
});

const mapResult = (result: any): TestResult => ({
  ...result,
  answerReview: (result.answerReview ?? []).map((item: any) => ({
    ...item,
    imageUrl: toAssetUrl(item.imageUrl),
  })),
});

const mapSession = (session: any): TestSession => ({
  ...session,
  result: session.result ? mapResult(session.result) : null,
  questions: (session.questions ?? []).map((question: any) => ({
    ...question,
    imageUrl: toAssetUrl(question.imageUrl),
  })),
  selectedQuestions: (session.selectedQuestions ?? []).map((question: any) => ({
    ...question,
    imageUrl: toAssetUrl(question.imageUrl),
  })),
});

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.auth !== false) {
    const token = getAdminToken();

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined && options.body !== null) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: string }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      typeof payload === 'object' && payload && 'details' in payload
        ? (payload as { details?: unknown }).details
        : payload
    );
  }

  return payload as T;
};

export const getApiBaseUrl = () => API_BASE_URL;

export const getHealth = () =>
  request<{ dataVersion: string; service: string; status: string; timestamp: string }>('/health', {
    auth: false,
  });

export const loginAdmin = async (credentials: { username: string; password: string }) =>
  request<{ admin: AdminProfile; token: string }>('/admin/auth/login', {
    auth: false,
    body: credentials,
    method: 'POST',
  });

export const logoutAdmin = () =>
  request<{ message: string }>('/admin/auth/logout', {
    body: {},
    method: 'POST',
  });

export const getAdminMe = async () => {
  const response = await request<{ admin: AdminProfile }>('/admin/auth/me');
  return response.admin;
};

export const listSubjects = async () => {
  const response = await request<{ items: SubjectConfig[] }>('/admin/subjects');
  return response.items;
};

export const listCandidateSubjects = async () => {
  const response = await request<{
    items: Array<Pick<SubjectConfig, 'id' | 'minutes' | 'name' | 'questionCount' | 'timeLimitSeconds'>>;
  }>('/candidate/subjects', {
    auth: false,
  });

  return response.items;
};

export const createSubject = (payload: {
  name: string;
  questionCount: number;
  timeLimitSeconds: number;
}) =>
  request<SubjectConfig>('/admin/subjects', {
    body: payload,
    method: 'POST',
  });

export const updateSubject = (
  id: string,
  payload: Partial<{ name: string; questionCount: number; timeLimitSeconds: number }>
) =>
  request<SubjectConfig>(`/admin/subjects/${id}`, {
    body: payload,
    method: 'PATCH',
  });

export const deleteSubject = (id: string) =>
  request<SubjectConfig>(`/admin/subjects/${id}`, {
    method: 'DELETE',
  });

export const listQuestions = async (params?: {
  limit?: number;
  page?: number;
  search?: string;
  subjectId?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set('page', String(params.page));
  }

  if (params?.limit) {
    query.set('limit', String(params.limit));
  }

  if (params?.search) {
    query.set('search', params.search);
  }

  if (params?.subjectId) {
    query.set('subjectId', params.subjectId);
  }

  const response = await request<{ items: any[]; pagination: any }>(
    `/admin/questions${query.size ? `?${query.toString()}` : ''}`
  );

  return {
    items: response.items.map(mapQuestion),
    pagination: response.pagination,
  };
};

export const listAllQuestions = async (params?: {
  search?: string;
  subjectId?: string;
}) => {
  const allItems: Question[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listQuestions({
      ...params,
      limit: 100,
      page,
    });

    allItems.push(...response.items);
    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return allItems;
};

export const createQuestion = async (payload: {
  correctAnswer: Question['correctAnswer'];
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  question: string;
  subjectId: string;
}) => mapQuestion(await request<any>('/admin/questions', { body: payload, method: 'POST' }));

export const updateQuestion = async (
  id: string,
  payload: Partial<{
    correctAnswer: Question['correctAnswer'];
    imageUrl: string | null;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    question: string;
    subjectId: string;
  }>
) => mapQuestion(await request<any>(`/admin/questions/${id}`, { body: payload, method: 'PATCH' }));

export const deleteQuestion = async (id: string) =>
  mapQuestion(await request<any>(`/admin/questions/${id}`, { method: 'DELETE' }));

export const uploadQuestionImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request<{
    filename: string;
    mimeType: string;
    originalName: string;
    size: number;
    url: string;
  }>('/admin/uploads/question-image', {
    body: formData,
    method: 'POST',
  });

  return {
    ...response,
    url: toAssetUrl(response.url) ?? response.url,
  };
};

export const listUins = async (params?: { search?: string; status?: 'all' | 'available' | 'used' }) => {
  const query = new URLSearchParams();

  if (params?.search) {
    query.set('search', params.search);
  }

  if (params?.status) {
    query.set('status', params.status);
  }

  const response = await request<{
    items: UIN[];
    summary: {
      available: number;
      locked: number;
      total: number;
      used: number;
      void: number;
    };
  }>(`/admin/uins${query.size ? `?${query.toString()}` : ''}`);

  return response;
};

export const generateUins = (payload: {
  count: number;
  subjectIds: string[];
  subjectsPerUin: number;
}) =>
  request<{ created: UIN[] }>('/admin/uins/generate', {
    body: payload,
    method: 'POST',
  });

export const voidUin = (id: string) =>
  request<UIN>(`/admin/uins/${id}`, {
    method: 'DELETE',
  });

export const listResults = async (params?: {
  academicYear?: string;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: 'date' | 'name' | 'score';
  sortOrder?: 'asc' | 'desc';
}) => {
  const query = new URLSearchParams();

  if (params?.page) {
    query.set('page', String(params.page));
  }

  if (params?.limit) {
    query.set('limit', String(params.limit));
  }

  if (params?.search) {
    query.set('search', params.search);
  }

  if (params?.sortBy) {
    query.set('sortBy', params.sortBy);
  }

  if (params?.sortOrder) {
    query.set('sortOrder', params.sortOrder);
  }

  if (params?.academicYear) {
    query.set('academicYear', params.academicYear);
  }

  const response = await request<{ items: any[]; pagination: any }>(
    `/admin/results${query.size ? `?${query.toString()}` : ''}`
  );

  return {
    items: response.items.map(mapResult),
    pagination: response.pagination,
  };
};

export const listAllResults = async (params?: {
  academicYear?: string;
  search?: string;
  sortBy?: 'date' | 'name' | 'score';
  sortOrder?: 'asc' | 'desc';
}) => {
  const allItems: TestResult[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await listResults({
      ...params,
      limit: 100,
      page,
    });

    allItems.push(...response.items);
    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return allItems;
};

export const getResult = async (id: string) =>
  mapResult(await request<any>(`/admin/results/${id}`));

export const getAcademicYearAnalytics = async () =>
  request<AcademicYearAnalytics[]>('/admin/analytics/academic-years');

export const getQuestionResponseAnalytics = async () => {
  const response = await request<QuestionResponseAnalyticsResponse>(
    '/admin/analytics/question-responses'
  );

  return {
    ...response,
    items: response.items.map((item) => ({
      ...item,
      imageUrl: toAssetUrl(item.imageUrl),
    })),
  };
};

export const getAdminExamSettings = () =>
  request<AdminExamSettings>('/admin/system/settings');

export const updateAdminExamSettings = (payload: Partial<AdminExamSettings>) =>
  request<AdminExamSettings>('/admin/system/settings', {
    body: payload,
    method: 'PATCH',
  });

export const restoreDefaultData = () =>
  request<RestoreDefaultResponse>('/admin/system/restore-default', {
    body: {
      confirmation: 'RESET_ALL_DATA',
    },
    method: 'POST',
  });

export const startCandidateSession = async (payload: {
  name: string;
  surname: string;
  uin: string;
}) =>
  mapSession(
    await request<any>('/candidate/sessions/start', {
      auth: false,
      body: payload,
      method: 'POST',
    })
  );

export const getCandidateSession = async (sessionId: string) =>
  mapSession(
    await request<any>(`/candidate/sessions/${sessionId}`, {
      auth: false,
    })
  );

export const saveCandidateAnswer = async (
  sessionId: string,
  payload: {
    answer: Question['correctAnswer'];
    currentQuestionIndex: number;
    currentSection: number;
    sessionQuestionId: string;
  }
) =>
  mapSession(
    await request<any>(`/candidate/sessions/${sessionId}/answers`, {
      auth: false,
      body: payload,
      method: 'PATCH',
    })
  );

export const advanceCandidateSection = async (
  sessionId: string,
  payload: { nextSectionIndex: number }
) =>
  mapSession(
    await request<any>(`/candidate/sessions/${sessionId}/advance-section`, {
      auth: false,
      body: payload,
      method: 'POST',
    })
  );

export const completeCandidateSession = async (sessionId: string) =>
  mapResult(
    await request<any>(`/candidate/sessions/${sessionId}/complete`, {
      auth: false,
      method: 'POST',
    })
  );
