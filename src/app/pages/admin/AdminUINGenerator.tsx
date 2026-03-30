import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Copy, CheckCircle, Clock3, Save, ShieldCheck, Hash } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  getUINs,
  generateUINCode,
  addUIN,
  deleteUIN,
  getSectionTimeLimits,
  setSectionTimeLimits,
  getSectionQuestionCounts,
  setSectionQuestionCounts,
  getQuestions,
} from '../../../utils/storage';
import { Section } from '../../../types';
import { getSections, getTotalConfiguredQuestions } from '../../../utils/testUtils';

const sections = getSections();

const toMinutes = (seconds: number) => Math.max(1, Math.floor(seconds / 60));
const toSeconds = (minutes: number) => Math.max(1, minutes) * 60;

export default function AdminUINGenerator() {
  const [uins, setUINs] = useState(getUINs());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState(1);
  const [savedTimeLimits, setSavedTimeLimits] = useState(getSectionTimeLimits());
  const [savedQuestionCounts, setSavedQuestionCounts] = useState(getSectionQuestionCounts());
  const [questions] = useState(getQuestions());
  const [draftTimers, setDraftTimers] = useState<Record<Section, number>>(() =>
    sections.reduce(
      (acc, section) => {
        acc[section] = toMinutes(savedTimeLimits[section]);
        return acc;
      },
      {} as Record<Section, number>
    )
  );
  const [draftQuestionCounts, setDraftQuestionCounts] = useState<Record<Section, number>>(() =>
    sections.reduce(
      (acc, section) => {
        acc[section] = savedQuestionCounts[section];
        return acc;
      },
      {} as Record<Section, number>
    )
  );

  const hasInvalidTimer = sections.some((section) => !draftTimers[section] || draftTimers[section] < 1);
  const hasInvalidQuestionCount = sections.some(
    (section) => !draftQuestionCounts[section] || draftQuestionCounts[section] < 1
  );
  const hasUnsavedTimerChanges = sections.some(
    (section) => toSeconds(draftTimers[section]) !== savedTimeLimits[section]
  );
  const hasUnsavedQuestionCountChanges = sections.some(
    (section) => draftQuestionCounts[section] !== savedQuestionCounts[section]
  );
  const availableQuestionsBySection = useMemo(
    () =>
      sections.reduce(
        (acc, section) => {
          acc[section] = questions.filter((question) => question.section === section).length;
          return acc;
        },
        {} as Record<Section, number>
      ),
    [questions]
  );
  const hasQuestionBankGap = sections.some(
    (section) => draftQuestionCounts[section] > availableQuestionsBySection[section]
  );

  const totalConfiguredMinutes = useMemo(
    () => sections.reduce((total, section) => total + draftTimers[section], 0),
    [draftTimers]
  );
  const totalConfiguredQuestions = useMemo(
    () => getTotalConfiguredQuestions(draftQuestionCounts),
    [draftQuestionCounts]
  );

  const handleSaveTimers = () => {
    if (hasInvalidTimer) {
      alert('Please enter a valid timer for every subject.');
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
      alert('Please enter a valid question count for every subject.');
      return;
    }

    if (hasQuestionBankGap) {
      alert('One or more subjects do not have enough saved questions for the requested count.');
      return;
    }

    setSectionQuestionCounts(draftQuestionCounts);
    setSavedQuestionCounts(draftQuestionCounts);
  };

  const handleGenerate = () => {
    if (
      hasUnsavedTimerChanges ||
      hasInvalidTimer ||
      hasUnsavedQuestionCountChanges ||
      hasInvalidQuestionCount ||
      hasQuestionBankGap
    ) {
      alert('Save valid timer and question-count settings for all subjects before generating UINs.');
      return;
    }

    const count = Math.min(Math.max(1, generateCount), 100);

    for (let index = 0; index < count; index += 1) {
      addUIN({
        id: Date.now().toString() + index,
        code: generateUINCode(),
        used: false,
        createdAt: new Date().toISOString(),
      });
    }

    setUINs(getUINs());
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
                Configure each subject timer before releasing exam access.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-200 md:text-base">
                Subject timers are saved here first, then every new candidate session starts
                with those exact time limits when a UIN is used.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Total Exam Time</p>
              <p className="mt-2 text-3xl font-semibold">{totalConfiguredMinutes} mins</p>
              <p className="mt-2 text-sm text-slate-300">{totalConfiguredQuestions} questions configured</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Subject Exam Setup
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set minutes and question counts for each section, save the configuration, then generate UINs.
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

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {sections.map((section) => (
              <div key={section} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{section}</p>
                    <p className="text-xs text-slate-500">
                      Available bank: {availableQuestionsBySection[section]} questions
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={draftTimers[section]}
                    onChange={(event) =>
                      setDraftTimers({
                        ...draftTimers,
                        [section]: Math.max(1, parseInt(event.target.value, 10) || 1),
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Questions
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      value={draftQuestionCounts[section]}
                      onChange={(event) =>
                        setDraftQuestionCounts({
                          ...draftQuestionCounts,
                          [section]: Math.max(1, parseInt(event.target.value, 10) || 1),
                        })
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-slate-900"
                    />
                  </div>
                  {draftQuestionCounts[section] > availableQuestionsBySection[section] ? (
                    <p className="mt-2 text-xs text-red-600">
                      Add more {section} questions or reduce this count.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Saved candidates get a UIN-based random selection for this subject.
                    </p>
                  )}
                </div>
              </div>
            ))}
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
                UIN generation stays locked until timers and subject question counts are saved.
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
