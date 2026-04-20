import type { AdminProfile, TestResult, TestSession } from '../types';

const ADMIN_TOKEN_KEY = 'westend_admin_token';
const ADMIN_PROFILE_KEY = 'westend_admin_profile';
const CURRENT_SESSION_ID_KEY = 'westend_current_session_id';
const CURRENT_SESSION_CACHE_KEY = 'westend_current_session_cache';
const LAST_RESULT_KEY = 'westend_last_result';
const CLIENT_DATA_VERSION_KEY = 'westend_client_data_version';

const isBrowser = () => typeof window !== 'undefined';

const readJson = <T>(key: string): T | null => {
  if (!isBrowser()) {
    return null;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getAdminToken = () =>
  isBrowser() ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;

export const setAdminSession = (token: string, admin: AdminProfile) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  writeJson(ADMIN_PROFILE_KEY, admin);
};

export const getStoredAdminProfile = () => readJson<AdminProfile>(ADMIN_PROFILE_KEY);

export const clearAdminSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_PROFILE_KEY);
};

export const getCurrentSessionId = () =>
  isBrowser() ? window.localStorage.getItem(CURRENT_SESSION_ID_KEY) : null;

export const setCurrentSessionState = (session: TestSession) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(CURRENT_SESSION_ID_KEY, session.sessionId);
  writeJson(CURRENT_SESSION_CACHE_KEY, session);
};

export const getCachedSession = () => readJson<TestSession>(CURRENT_SESSION_CACHE_KEY);

export const clearCurrentSessionState = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(CURRENT_SESSION_ID_KEY);
  window.localStorage.removeItem(CURRENT_SESSION_CACHE_KEY);
};

export const setLatestResult = (result: TestResult) => {
  writeJson(LAST_RESULT_KEY, result);
};

export const getLatestResult = () => readJson<TestResult>(LAST_RESULT_KEY);

export const clearLatestResult = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(LAST_RESULT_KEY);
};

export const clearClientTrainingData = () => {
  clearCurrentSessionState();
  clearLatestResult();
};

export const syncClientDataVersion = (dataVersion: string) => {
  if (!isBrowser() || !dataVersion) {
    return false;
  }

  const currentDataVersion = window.localStorage.getItem(CLIENT_DATA_VERSION_KEY);
  const hasChanged = Boolean(currentDataVersion && currentDataVersion !== dataVersion);

  if (hasChanged) {
    clearClientTrainingData();
  }

  window.localStorage.setItem(CLIENT_DATA_VERSION_KEY, dataVersion);
  return hasChanged;
};
