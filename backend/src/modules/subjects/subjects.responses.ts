import type { DataStore, SubjectRecord } from '../../lib/store.js';
import { toSubjectResponse } from '../../common/utils/serializers.js';

export const getActiveSubjectsResponse = (store: DataStore) =>
  store.subjects
    .filter((subject) => subject.isActive)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((subject) => toSubjectResponse(store, subject));

export const getCandidateSubjectsResponse = (store: DataStore) =>
  getActiveSubjectsResponse(store).map((subject) => ({
    id: subject.id,
    name: subject.name,
    timeLimitSeconds: subject.timeLimitSeconds,
    minutes: subject.minutes,
    questionCount: subject.questionCount,
  }));
