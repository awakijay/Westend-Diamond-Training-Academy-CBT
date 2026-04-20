import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Copy, CheckCircle, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  createSubject,
  deleteSubject,
  generateUins,
  listAllQuestions,
  listSubjects,
  listUins,
  voidUin,
  updateSubject,
} from '../../../utils/api';
import { SubjectConfig, UIN } from '../../../types';

type EditableSubject = SubjectConfig & {
  localOnly?: boolean;
};

const toMinutes = (seconds: number) => Math.max(0, Math.floor(seconds / 60));

const areSubjectsEquivalent = (left: EditableSubject, right: SubjectConfig) =>
  left.name.trim() === right.name &&
  left.questionCount === right.questionCount &&
  left.minutes === right.minutes;

export default function AdminUINGenerator() {
  const [uins, setUINs] = useState<UIN[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState(1);
  const [questionsBySubjectId, setQuestionsBySubjectId] = useState<Record<string, number>>({});
  const [savedSubjects, setSavedSubjects] = useState<SubjectConfig[]>([]);
  const [subjectConfigsState, setSubjectConfigsState] = useState<EditableSubject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedSubjectCount, setSelectedSubjectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAdminSetup = async () => {
    setIsLoading(true);

    try {
      const [subjectsResponse, questionsResponse, uinsResponse] = await Promise.all([
        listSubjects(),
        listAllQuestions(),
        listUins({ status: 'all' }),
      ]);

      const questionCounts = questionsResponse.reduce(
        (acc, question) => {
          acc[question.subjectId] = (acc[question.subjectId] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      setQuestionsBySubjectId(questionCounts);
      setSavedSubjects(subjectsResponse);
      setSubjectConfigsState(subjectsResponse.map((subject) => ({ ...subject })));
      setUINs(uinsResponse.items);
      setSelectedSubjectIds((current) => {
        const allowedIds = new Set(subjectsResponse.map((subject) => subject.id));
        const nextSelected = current.filter((id) => allowedIds.has(id));
        return nextSelected.length > 0 ? nextSelected : subjectsResponse.map((subject) => subject.id);
      });
      setSelectedSubjectCount((current) =>
        current > 0 ? Math.min(current, subjectsResponse.length) : subjectsResponse.length
      );
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load UIN setup.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminSetup();
  }, []);

  useEffect(() => {
    if (selectedSubjectCount > subjectConfigsState.length) {
      setSelectedSubjectCount(subjectConfigsState.length);
    }

    if (selectedSubjectCount === 0 && subjectConfigsState.length > 0) {
      setSelectedSubjectCount(subjectConfigsState.length);
    }
  }, [selectedSubjectCount, subjectConfigsState.length]);

  const hasInvalidTimer = subjectConfigsState.some((subject) => subject.minutes < 1);
  const hasInvalidQuestionCount = subjectConfigsState.some((subject) => subject.questionCount < 1);
  const hasUnsavedChanges =
    subjectConfigsState.length !== savedSubjects.length ||
    subjectConfigsState.some((subject) => {
      if (subject.localOnly) {
        return true;
      }

      const savedSubject = savedSubjects.find((item) => item.id === subject.id);
      return !savedSubject || !areSubjectsEquivalent(subject, savedSubject);
    });

  const subjectsWithQuestionBankGap = subjectConfigsState.filter((subject) => {
    const bankCount = questionsBySubjectId[subject.id] ?? 0;
    return subject.questionCount > bankCount;
  });
  const hasQuestionBankGap = subjectsWithQuestionBankGap.length > 0;

  const totalConfiguredMinutes = useMemo(
    () => subjectConfigsState.reduce((total, subject) => total + subject.minutes, 0),
    [subjectConfigsState]
  );

  const totalConfiguredQuestions = useMemo(
    () => subjectConfigsState.reduce((total, subject) => total + subject.questionCount, 0),
    [subjectConfigsState]
  );

  const savedTotalMinutes = useMemo(
    () => savedSubjects.reduce((total, subject) => total + subject.minutes, 0),
    [savedSubjects]
  );

  const savedTotalQuestions = useMemo(
    () => savedSubjects.reduce((total, subject) => total + subject.questionCount, 0),
    [savedSubjects]
  );

  const handleAddSubject = () => {
    const newSubject: EditableSubject = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Course ${subjectConfigsState.length + 1}`,
      timeLimitSeconds: 30 * 60,
      minutes: 30,
      questionCount: 10,
      questionBankCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      localOnly: true,
    };

    setSubjectConfigsState((current) => [...current, newSubject]);
    setSelectedSubjectIds((current) => [...current, newSubject.id]);
    setSelectedSubjectCount((current) => current + 1);
  };

  const handleRemoveSubject = (id: string) => {
    const filtered = subjectConfigsState.filter((subject) => subject.id !== id);
    setSubjectConfigsState(filtered);
    setSelectedSubjectIds((current) => current.filter((subjectId) => subjectId !== id));
  };

  const saveSubjectConfigs = async () => {
    if (subjectConfigsState.some((subject) => !subject.name.trim())) {
      window.alert('Please set a name for every course.');
      return;
    }

    const normalizedSubjects = subjectConfigsState.map((subject) => ({
      ...subject,
      name: subject.name.trim(),
      minutes: Math.max(1, subject.minutes),
      questionCount: Math.max(1, subject.questionCount),
    }));

    setIsSaving(true);

    try {
      const savedById = new Map(savedSubjects.map((subject) => [subject.id, subject]));
      const idsToKeep = new Set(
        normalizedSubjects.filter((subject) => !subject.localOnly).map((subject) => subject.id)
      );
      const toDelete = savedSubjects.filter((subject) => !idsToKeep.has(subject.id));
      const toCreate = normalizedSubjects.filter((subject) => subject.localOnly);
      const toUpdate = normalizedSubjects.filter((subject) => {
        if (subject.localOnly) {
          return false;
        }

        const savedSubject = savedById.get(subject.id);
        return Boolean(savedSubject) && !areSubjectsEquivalent(subject, savedSubject);
      });

      await Promise.all(
        toCreate.map((subject) =>
          createSubject({
            name: subject.name,
            timeLimitSeconds: subject.minutes * 60,
            questionCount: subject.questionCount,
          })
        )
      );

      await Promise.all(
        toUpdate.map((subject) =>
          updateSubject(subject.id, {
            name: subject.name,
            timeLimitSeconds: subject.minutes * 60,
            questionCount: subject.questionCount,
          })
        )
      );

      await Promise.all(toDelete.map((subject) => deleteSubject(subject.id)));

      await loadAdminSetup();
      window.alert('Course setup saved.');
    } catch (saveError) {
      window.alert(
        saveError instanceof Error ? saveError.message : 'Unable to save course setup.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    const activeSubjectIds = selectedSubjectIds
      .filter((id) => subjectConfigsState.some((subject) => subject.id === id))
      .slice(0, Math.min(selectedSubjectCount, selectedSubjectIds.length));

    if (activeSubjectIds.length === 0) {
      window.alert('Please select at least one course to assign to UINs.');
      return;
    }

    if (hasUnsavedChanges || hasInvalidTimer || hasInvalidQuestionCount || hasQuestionBankGap) {
      window.alert('Save a valid exam setup before generating UINs.');
      return;
    }

    setIsSaving(true);

    try {
      await generateUins({
        count: Math.min(Math.max(1, generateCount), 100),
        subjectIds: activeSubjectIds,
        subjectsPerUin: activeSubjectIds.length,
      });
      const refreshedUins = await listUins({ status: 'all' });
      setUINs(refreshedUins.items);
      window.alert('UIN(s) generated successfully.');
    } catch (generateError) {
      window.alert(
        generateError instanceof Error ? generateError.message : 'Unable to generate UINs.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this UIN?')) {
      return;
    }

    try {
      await voidUin(id);
      setUINs((current) => current.filter((uin) => uin.id !== id));
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : 'Unable to delete UIN.');
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const availableUINs = uins.filter((uin) => !uin.used && uin.status === 'AVAILABLE');
  const usedUINs = uins.filter((uin) => uin.used);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#082f49_0%,#0f172a_55%,#1e293b_100%)] p-8 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.75)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                UIN And Timing Control
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Configure each course timer before releasing exam access.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-200 md:text-base">
                Course timers are saved here first, then every new candidate session starts
                with those exact time limits when a UIN is used.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Total Exam Time </p>
              <p className="mt-2 text-3xl font-semibold">
                {totalConfiguredMinutes || 0} mins
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {totalConfiguredQuestions || 0} questions configured
              </p>
              <p className="mt-3 text-xs text-slate-300">
                Saved profile: {savedTotalMinutes || 0} mins - {savedTotalQuestions || 0} questions
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Course Exam Setup
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Set minutes and question counts for each course, save the configuration, then generate UINs.
              </p>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-sm ${
                hasUnsavedChanges || hasInvalidTimer || hasInvalidQuestionCount || hasQuestionBankGap
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-100'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
            >
              {hasUnsavedChanges || hasInvalidTimer || hasInvalidQuestionCount || hasQuestionBankGap
                ? 'Save exam setup before UIN generation'
                : 'Exam setup saved and ready'}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Custom Course Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter course names, time, question counts and choose the number of courses per UIN.
                </p>
              </div>
              <button
                onClick={handleAddSubject}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                <Plus className="h-4 w-4" /> Add Course
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">Course</th>
                    <th className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">Minutes</th>
                    <th className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">Questions</th>
                    <th className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">Bank</th>
                    <th className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectConfigsState.map((subject) => {
                    const bankCount = questionsBySubjectId[subject.id] || 0;
                    return (
                      <tr key={subject.id} className="border-b border-slate-200 dark:border-slate-800">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={subject.name}
                            onChange={(event) => {
                              const nextName = event.target.value;
                              setSubjectConfigsState((current) =>
                                current.map((item) =>
                                  item.id === subject.id ? { ...item, name: nextName } : item
                                )
                              );
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={subject.minutes}
                            onChange={(event) => {
                              const nextMinutes = Math.max(1, parseInt(event.target.value, 10) || 1);
                              setSubjectConfigsState((current) =>
                                current.map((item) =>
                                  item.id === subject.id
                                    ? {
                                        ...item,
                                        minutes: nextMinutes,
                                        timeLimitSeconds: nextMinutes * 60,
                                      }
                                    : item
                                )
                              );
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={subject.questionCount}
                            onChange={(event) => {
                              const nextQuestions = Math.max(1, parseInt(event.target.value, 10) || 1);
                              setSubjectConfigsState((current) =>
                                current.map((item) =>
                                  item.id === subject.id
                                    ? { ...item, questionCount: nextQuestions }
                                    : item
                                )
                              );
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{bankCount}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveSubject(subject.id)}
                            className="rounded-full border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Choose Courses for UIN Selection
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {subjectConfigsState.map((subject) => (
                  <label key={subject.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject.id)}
                      onChange={() => {
                        const nextSelected = selectedSubjectIds.includes(subject.id)
                          ? selectedSubjectIds.filter((item) => item !== subject.id)
                          : [...selectedSubjectIds, subject.id];
                        setSelectedSubjectIds(nextSelected);
                        setSelectedSubjectCount(Math.min(nextSelected.length, selectedSubjectCount || nextSelected.length));
                      }}
                      className="h-4 w-4 border-slate-300 text-cyan-600 dark:border-slate-700"
                    />
                    <span className="text-xs text-slate-800 dark:text-slate-200">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Courses per UIN
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedSubjectIds.length || 1}
                  value={Math.max(1, Math.min(selectedSubjectCount || 1, selectedSubjectIds.length || 1))}
                  onChange={(event) => {
                    const parsed = Math.max(
                      1,
                      Math.min(selectedSubjectIds.length, parseInt(event.target.value, 10) || 1)
                    );
                    setSelectedSubjectCount(parsed);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Controls how many selected courses are included in each generated UIN.
                </p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => void saveSubjectConfigs()}
                  disabled={isSaving}
                  className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                >
                  Save Courses
                </button>
              </div>
            </div>

            {hasQuestionBankGap ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                Add more questions or reduce the course question counts before generating UINs.
                Affected courses: {subjectsWithQuestionBankGap.map((subject) => subject.name).join(', ')}.
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void saveSubjectConfigs()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <Save className="h-4 w-4" />
              Save Setup
            </button>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Saved profile: {savedTotalMinutes} mins
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Saved questions: {savedTotalQuestions}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Generate New UINs
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                UIN generation stays locked until timers and course question counts are saved.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Questions are randomized per UIN, so learners do not all receive the same sequence.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Available: {availableUINs.length} | Used: {usedUINs.length}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full max-w-xs">
              <label className="mb-2 block text-sm text-slate-700 dark:text-slate-300">
                Number of UINs to Generate
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(event) => setGenerateCount(parseInt(event.target.value, 10) || 1)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400"
              />
            </div>

            <button
              onClick={() => void handleGenerate()}
              disabled={
                isSaving ||
                selectedSubjectIds.length === 0 ||
                hasUnsavedChanges ||
                hasInvalidTimer ||
                hasInvalidQuestionCount ||
                hasQuestionBankGap
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <Plus className="h-4 w-4" />
              Generate UINs
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Available UINs ({availableUINs.length})
              </h2>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                Ready
              </div>
            </div>

            <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {isLoading ? (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                  Loading available UINs...
                </div>
              ) : availableUINs.length === 0 ? (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                  No available UINs yet. Save the exam setup and generate some.
                </div>
              ) : (
                availableUINs.map((uin) => (
                  <div
                    key={uin.id}
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 dark:hover:bg-slate-900/70"
                  >
                    <div>
                      <p className="font-mono text-lg text-slate-900 dark:text-slate-100">{uin.code}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Created: {format(new Date(uin.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(uin.code, uin.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-100"
                      >
                        {copiedId === uin.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => void handleDelete(uin.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Used UINs ({usedUINs.length})
              </h2>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Completed
              </div>
            </div>

            <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {isLoading ? (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                  Loading used UINs...
                </div>
              ) : usedUINs.length === 0 ? (
                <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                  No UINs have been used yet.
                </div>
              ) : (
                usedUINs.map((uin) => (
                  <div key={uin.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-lg text-slate-900 dark:text-slate-100">{uin.code}</p>
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Used by: {uin.usedBy}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Used on:{' '}
                          {uin.usedAt ? format(new Date(uin.usedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopy(uin.code, uin.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-100"
                      >
                        {copiedId === uin.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
