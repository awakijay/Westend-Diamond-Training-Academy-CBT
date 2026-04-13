import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Copy, CheckCircle, Clock3, Save, ShieldCheck, Hash } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  getUINs,
  setUINs as persistUINs,
  generateUINCode,
  addUIN,
  deleteUIN,
  getSectionTimeLimits,
  setSectionTimeLimits,
  getSectionQuestionCounts,
  setSectionQuestionCounts,
  getSubjectConfigs,
  setSubjectConfigs,
  getQuestions,
  setQuestions,
} from '../../../utils/storage';
import { Section, SubjectConfig } from '../../../types';
import { getSections, getTotalConfiguredQuestions } from '../../../utils/testUtils';

const toMinutes = (seconds: number) => Math.max(0, Math.floor(seconds / 60));
const toSeconds = (minutes: number) => Math.max(0, minutes) * 60;

export default function AdminUINGenerator() {
  const [uins, setUINs] = useState(getUINs());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState(1);
  const [savedTimeLimits, setSavedTimeLimits] = useState(getSectionTimeLimits());
  const [savedQuestionCounts, setSavedQuestionCounts] = useState(getSectionQuestionCounts());
  const [questions, setQuestionsState] = useState(getQuestions());
  const [subjectConfigsState, setSubjectConfigsState] = useState<SubjectConfig[]>(() =>
    getSubjectConfigs().map((subject) => ({
      ...subject,
      minutes: toMinutes(savedTimeLimits[subject.name] ?? subject.minutes * 60),
      questions: savedQuestionCounts[subject.name] ?? subject.questions,
    }))
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() =>
    getSubjectConfigs().map((subject) => subject.name)
  );
  const [selectedSubjectCount, setSelectedSubjectCount] = useState<number>(getSubjectConfigs().length);

  const sections = useMemo(() => subjectConfigsState.map((subject) => subject.name), [subjectConfigsState]);

  const safeMinutes = (section: string) => {
    const override = subjectConfigsState.find((subject) => subject.name === section);
    return override ? override.minutes : 30;
  };

  const safeQuestions = (section: string) => {
    const override = subjectConfigsState.find((subject) => subject.name === section);
    return override ? override.questions : 10;
  };

  const [draftTimers, setDraftTimers] = useState<Record<Section, number>>(() =>
    sections.reduce((acc, section) => {
      const stored = savedTimeLimits[section];
      acc[section] = toMinutes(typeof stored === 'number' && stored > 0 ? stored : safeMinutes(section) * 60);
      return acc;
    }, {} as Record<Section, number>)
  );

  const [draftQuestionCounts, setDraftQuestionCounts] = useState<Record<Section, number>>(() =>
    sections.reduce((acc, section) => {
      const stored = savedQuestionCounts[section];
      acc[section] = stored && stored > 0 ? stored : safeQuestions(section);
      return acc;
    }, {} as Record<Section, number>)
  );

  const hasInvalidTimer = sections.some((section) => draftTimers[section] === undefined || draftTimers[section] < 0);
  const hasInvalidQuestionCount = sections.some(
    (section) => draftQuestionCounts[section] === undefined || draftQuestionCounts[section] < 0
  );
  const hasUnsavedTimerChanges = sections.some(
    (section) => toSeconds(draftTimers[section]) !== savedTimeLimits[section]
  );
  const hasUnsavedQuestionCountChanges = sections.some(
    (section) => draftQuestionCounts[section] !== savedQuestionCounts[section]
  );

  const subjectQuestionBank = useMemo(
    () =>
      subjectConfigsState.reduce((acc, subject) => {
        acc[subject.name] = questions.filter((question) => question.section === subject.name).length;
        return acc;
      }, {} as Record<string, number>),
    [questions, subjectConfigsState]
  );

  const hasQuestionBankGap = subjectConfigsState.some(
    (subject) =>
      subject.questions < 0 ||
      (subjectQuestionBank[subject.name] || 0) === 0
        ? false
        : subject.questions > (subjectQuestionBank[subject.name] || 0)
  );

  const totalConfiguredMinutes = useMemo(
    () =>
      subjectConfigsState.reduce((total, subject) => {
        const minutes = draftTimers[subject.name] ?? subject.minutes ?? 0;
        return total + minutes;
      }, 0),
    [subjectConfigsState, draftTimers]
  );

  const totalConfiguredQuestions = useMemo(
    () =>
      subjectConfigsState.reduce((total, subject) => {
        const count = draftQuestionCounts[subject.name] ?? subject.questions ?? 0;
        return total + count;
      }, 0),
    [subjectConfigsState, draftQuestionCounts]
  );

  const savedTotalMinutes = useMemo(
    () =>
      subjectConfigsState.reduce((total, subject) => {
        const minutes = savedTimeLimits[subject.name]
          ? toMinutes(savedTimeLimits[subject.name])
          : subject.minutes ?? 0;
        return total + minutes;
      }, 0),
    [subjectConfigsState, savedTimeLimits]
  );

  const savedTotalQuestions = useMemo(
    () =>
      subjectConfigsState.reduce((total, subject) => {
        const count = savedQuestionCounts[subject.name] ?? subject.questions ?? 0;
        return total + count;
      }, 0),
    [subjectConfigsState, savedQuestionCounts]
  );

  // Keep dynamic subject timers / question counts aligned when subject set changes
  useEffect(() => {
    const mergedTimers: Record<string, number> = {};
    sections.forEach((section) => {
      mergedTimers[section] = draftTimers[section] ?? toMinutes(safeMinutes(section) * 60);
    });
    setDraftTimers(mergedTimers);

    const mergedQuestions: Record<string, number> = {};
    sections.forEach((section) => {
      mergedQuestions[section] = draftQuestionCounts[section] ?? safeQuestions(section);
    });
    setDraftQuestionCounts(mergedQuestions);

    setSavedTimeLimits((prev) => {
      const next = { ...prev };
      sections.forEach((section) => {
        if (next[section] === undefined) next[section] = safeMinutes(section) * 60;
      });
      return next;
    });

    setSavedQuestionCounts((prev) => {
      const next = { ...prev };
      sections.forEach((section) => {
        if (next[section] === undefined) next[section] = safeQuestions(section);
      });
      return next;
    });

    if (selectedSubjectCount > sections.length) {
      setSelectedSubjectCount(sections.length);
    }
  }, [sections, subjectConfigsState]);

  const handleSaveTimers = () => {
    if (hasInvalidTimer) {
      alert('Please enter a valid timer for every course.');
      return;
    }

    const updatedLimits = sections.reduce(
      (acc, section) => {
        acc[section] = toSeconds(draftTimers[section]);
        return acc;
      },
      {} as Record<Section, number>
    );

    setSectionTimeLimits(updatedLimits);
    setSavedTimeLimits(updatedLimits);
  };

  const handleSaveQuestionCounts = () => {
    if (hasInvalidQuestionCount) {
      alert('Please enter a valid question count (0 or more) for every course.');
      return;
    }

    // Allow saving even if there are not yet questions; admins may add them later.
    setSectionQuestionCounts(draftQuestionCounts);
    setSavedQuestionCounts(draftQuestionCounts);
  };

  const handleAddSubject = () => {
    const newSubject: SubjectConfig = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: `Course ${subjectConfigsState.length + 1}`,
      minutes: 30,
      questions: 10,
    };
    const updated = [...subjectConfigsState, newSubject];
    setSubjectConfigsState(updated);
    setSubjectConfigs(updated);
    setSelectedSubjects((prev) => [...prev, newSubject.name]);
    setSelectedSubjectCount(updated.length);
  };

  const handleRemoveSubject = (id: string) => {
    const removedSubject = subjectConfigsState.find((subject) => subject.id === id);
    const filtered = subjectConfigsState.filter((subject) => subject.id !== id);

    setSubjectConfigsState(filtered);
    setSubjectConfigs(filtered);

    if (removedSubject) {
      const remainingQuestions = getQuestions().filter(
        (question) => question.section !== removedSubject.name
      );
      setQuestions(remainingQuestions);
      setQuestionsState(remainingQuestions);
    }

    const filteredSubjects = selectedSubjects.filter((subjectName) =>
      filtered.some((subject) => subject.name === subjectName)
    );
    setSelectedSubjects(filteredSubjects);

    if (selectedSubjectCount > filtered.length) {
      setSelectedSubjectCount(filtered.length);
    }
  };

  const saveSubjectConfigs = () => {
    if (subjectConfigsState.some((subject) => !subject.name.trim())) {
      alert('Please set a name for every course.');
      return;
    }

    const previousSubjects = getSubjectConfigs();
    const renameMap = previousSubjects.reduce((acc, subject) => {
      const nextSubject = subjectConfigsState.find((item) => item.id === subject.id);
      if (nextSubject && nextSubject.name !== subject.name) {
        acc[subject.name] = nextSubject.name;
      }
      return acc;
    }, {} as Record<string, string>);

    const normalizedSubjects = subjectConfigsState.map((subject) => ({
      ...subject,
      name: subject.name.trim(),
    }));

    if (Object.keys(renameMap).length > 0) {
      const renamedQuestions = getQuestions().map((question) => ({
        ...question,
        section: renameMap[question.section] ?? question.section,
      }));
      setQuestions(renamedQuestions);
      setQuestionsState(renamedQuestions);

      const renamedUINs = getUINs().map((uin) => ({
        ...uin,
        subjects: uin.subjects?.map((subject) => renameMap[subject] ?? subject),
      }));
      persistUINs(renamedUINs);

      const updatedTimeLimits = Object.entries(savedTimeLimits).reduce((acc, [name, value]) => {
        acc[renameMap[name] ?? name] = value;
        return acc;
      }, {} as Record<string, number>);
      const updatedQuestionCounts = Object.entries(savedQuestionCounts).reduce((acc, [name, value]) => {
        acc[renameMap[name] ?? name] = value;
        return acc;
      }, {} as Record<string, number>);

      setSavedTimeLimits(updatedTimeLimits);
      setSavedQuestionCounts(updatedQuestionCounts);
      setSectionTimeLimits(updatedTimeLimits);
      setSectionQuestionCounts(updatedQuestionCounts);
      setSelectedSubjects((prev) => prev.map((subject) => renameMap[subject] ?? subject));
      setDraftTimers((prev) =>
        Object.entries(prev).reduce((acc, [name, value]) => {
          acc[renameMap[name] ?? name] = value;
          return acc;
        }, {} as Record<Section, number>)
      );
      setDraftQuestionCounts((prev) =>
        Object.entries(prev).reduce((acc, [name, value]) => {
          acc[renameMap[name] ?? name] = value;
          return acc;
        }, {} as Record<Section, number>)
      );
    }

    setSubjectConfigs(normalizedSubjects);
    setSubjectConfigsState(normalizedSubjects);
    alert('Course setup saved.');
  };

  const handleGenerate = () => {
    const activeSubjectNames = selectedSubjects
      .filter((name) => sections.includes(name))
      .slice(0, Math.min(selectedSubjectCount, selectedSubjects.length));

    if (activeSubjectNames.length === 0) {
      alert('Please select at least one course to assign to UINs.');
      return;
    }

    if (
      hasUnsavedTimerChanges ||
      hasInvalidTimer ||
      hasUnsavedQuestionCountChanges ||
      hasInvalidQuestionCount ||
      hasQuestionBankGap
    ) {
      alert('Save valid timer and question-count settings for all courses before generating UINs.');
      return;
    }

    const count = Math.min(Math.max(1, generateCount), 100);
    const selectedSubjectNames = activeSubjectNames;

    for (let index = 0; index < count; index += 1) {
      addUIN({
        id: `${Date.now()}-${index}`,
        code: generateUINCode(),
        used: false,
        createdAt: new Date().toISOString(),
        subjectCount: selectedSubjectNames.length,
        subjects: selectedSubjectNames,
      });
    }

    setUINs(getUINs());
    alert('UIN(s) generated successfully.');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this UIN?')) {
      deleteUIN(id);
      setUINs(getUINs());
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const availableUINs = uins.filter((uin) => !uin.used);
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
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Total Exam Time (Draft)</p>
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

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Course Exam Setup
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set minutes and question counts for each course, save the configuration, then generate UINs.
              </p>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-sm ${
                hasUnsavedTimerChanges ||
                hasInvalidTimer ||
                hasUnsavedQuestionCountChanges ||
                hasInvalidQuestionCount ||
                hasQuestionBankGap
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {hasUnsavedTimerChanges ||
              hasInvalidTimer ||
              hasUnsavedQuestionCountChanges ||
              hasInvalidQuestionCount ||
              hasQuestionBankGap
                ? 'Save exam setup before UIN generation'
                : 'Exam setup saved and ready'}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Custom Course Configuration</h3>
                <p className="text-sm text-slate-500">
                  Enter course names, time, question counts and choose the number of courses per UIN.
                </p>
              </div>
              <button
                onClick={handleAddSubject}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" /> Add Course
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-xs text-slate-600">Course</th>
                    <th className="px-3 py-2 text-xs text-slate-600">Minutes</th>
                    <th className="px-3 py-2 text-xs text-slate-600">Questions</th>
                    <th className="px-3 py-2 text-xs text-slate-600">Bank</th>
                    <th className="px-3 py-2 text-xs text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectConfigsState.map((subject) => {
                    const bankCount = subjectQuestionBank[subject.name] || 0;
                    return (
                      <tr key={subject.id} className="border-b border-slate-200">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={subject.name}
                            onChange={(event) => {
                              const nextName = event.target.value;
                              const updated = subjectConfigsState.map((item) =>
                                item.id === subject.id ? { ...item, name: nextName } : item
                              );
                              setSubjectConfigsState(updated);
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={subject.minutes}
                            onChange={(event) => {
                              const nextMinutes = Math.max(1, parseInt(event.target.value, 10) || 1);
                              const updated = subjectConfigsState.map((item) =>
                                item.id === subject.id
                                  ? { ...item, minutes: nextMinutes }
                                  : item
                              );
                              setSubjectConfigsState(updated);
                              setDraftTimers((prev) => ({ ...prev, [subject.name]: nextMinutes }));
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={subject.questions}
                            onChange={(event) => {
                              const nextQuestions = Math.max(1, parseInt(event.target.value, 10) || 1);
                              const updated = subjectConfigsState.map((item) =>
                                item.id === subject.id
                                  ? { ...item, questions: nextQuestions }
                                  : item
                              );
                              setSubjectConfigsState(updated);
                              setDraftQuestionCounts((prev) => ({ ...prev, [subject.name]: nextQuestions }));
                            }}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">{bankCount}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveSubject(subject.id)}
                            className="rounded-full border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
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
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Choose Courses for UIN Selection
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {subjectConfigsState.map((subject) => (
                  <label key={subject.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.name)}
                      onChange={() => {
                        const newSelected = selectedSubjects.includes(subject.name)
                          ? selectedSubjects.filter((item) => item !== subject.name)
                          : [...selectedSubjects, subject.name];
                        setSelectedSubjects(newSelected);
                        setSelectedSubjectCount(newSelected.length);
                      }}
                      className="h-4 w-4 text-cyan-600 border-slate-300"
                    />
                    <span className="text-xs text-slate-800">{subject.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Courses per UIN
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedSubjects.length || 1}
                  value={selectedSubjectCount}
                  onChange={(event) => {
                    const parsed = Math.max(1, Math.min(selectedSubjects.length, parseInt(event.target.value, 10) || 1));
                    setSelectedSubjectCount(parsed);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                <p className="text-xs text-slate-500">
                  Controls how many selected courses are included in each generated UIN.
                </p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveSubjectConfigs}
                  className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Save Courses
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveTimers}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Save className="h-4 w-4" />
              Save Timers
            </button>
            <button
              onClick={handleSaveQuestionCounts}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Save className="h-4 w-4" />
              Save Question Counts
            </button>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Saved profile: {sections.reduce((total, section) => total + toMinutes(savedTimeLimits[section]), 0)} mins
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Saved questions: {getTotalConfiguredQuestions(savedQuestionCounts)}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Generate New UINs
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  UIN generation stays locked until timers and course question counts are saved.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Questions are randomized per UIN, so learners do not all receive the same sequence.
                </p>
              </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Available: {availableUINs.length} | Used: {usedUINs.length}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full max-w-xs">
              <label className="mb-2 block text-sm text-slate-700">
                Number of UINs to Generate
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(event) => setGenerateCount(parseInt(event.target.value, 10) || 1)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={
                selectedSubjects.length === 0 ||
                hasUnsavedTimerChanges ||
                hasInvalidTimer ||
                hasUnsavedQuestionCountChanges ||
                hasInvalidQuestionCount ||
                hasQuestionBankGap
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Generate UINs
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Available UINs ({availableUINs.length})
              </h2>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Ready
              </div>
            </div>

            <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
              {availableUINs.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  No available UINs yet. Save the exam setup and generate some.
                </div>
              ) : (
                availableUINs.map((uin) => (
                  <div
                    key={uin.id}
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-mono text-lg text-slate-900">{uin.code}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Created: {format(new Date(uin.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(uin.code, uin.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {copiedId === uin.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(uin.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Used UINs ({usedUINs.length})
              </h2>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Completed
              </div>
            </div>

            <div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
              {usedUINs.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  No UINs have been used yet.
                </div>
              ) : (
                usedUINs.map((uin) => (
                  <div key={uin.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-lg text-slate-900">{uin.code}</p>
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">Used by: {uin.usedBy}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Used on:{' '}
                          {uin.usedAt ? format(new Date(uin.usedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopy(uin.code, uin.id)}
                        className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
