import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Clock, ChevronRight, AlertCircle, BookOpen, CheckCircle2, WifiOff } from 'lucide-react';
import logo from '../../assets/wednl-banner1-3.png';
import type { AnswerOption, TestResult, TestSession } from '../../types';
import {
  advanceCandidateSection,
  ApiError,
  completeCandidateSession,
  getCandidateSession,
  saveCandidateAnswer,
} from '../../utils/api';
import {
  clearCurrentSessionState,
  getCachedSession,
  getCurrentSessionId,
  setCurrentSessionState,
  setLatestResult,
} from '../../utils/clientState';
import { getQuestionsForSection, getSelectedQuestions, formatTime } from '../../utils/testUtils';

export default function TestPage() {
  const navigate = useNavigate();
  const timerSyncInFlight = useRef(false);
  const [session, setSession] = useState<TestSession | null>(getCachedSession());
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(() => getCachedSession()?.currentSectionRemainingTimeSeconds ?? 0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [error, setError] = useState('');
  const [isSavingChoice, setIsSavingChoice] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const setSessionAndPersist = (nextSession: TestSession) => {
    setSession(nextSession);
    setCurrentSessionState(nextSession);
    setTimeLeft(nextSession.isOnSectionBreak ? 0 : nextSession.currentSectionRemainingTimeSeconds);
  };

  const finishWithResult = (result: TestResult) => {
    setLatestResult(result);
    clearCurrentSessionState();
    navigate('/results');
  };

  const syncSessionFromServer = async (sessionId: string) => {
    const latestSession = await getCandidateSession(sessionId);

    if (latestSession.status === 'COMPLETED' && latestSession.result) {
      finishWithResult(latestSession.result);
      return latestSession;
    }

    setSessionAndPersist(latestSession);
    return latestSession;
  };

  useEffect(() => {
    const initializeSession = async () => {
      const sessionId = getCurrentSessionId();

      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        await syncSessionFromServer(sessionId);
      } catch (loadError) {
        clearCurrentSessionState();
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : 'Unable to restore your test session.'
        );
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    void initializeSession();
  }, [navigate]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const currentQuestion = getQuestionsForSection(session, session.currentSection)[
      session.currentQuestionIndex
    ];

    if (!currentQuestion || session.isOnSectionBreak) {
      setSelectedAnswer(null);
      return;
    }

    setSelectedAnswer(session.answers[currentQuestion.sessionQuestionId] ?? null);
  }, [session]);

  useEffect(() => {
    if (!session || session.isOnSectionBreak || session.status !== 'ACTIVE') {
      return;
    }

    setTimeLeft(session.currentSectionRemainingTimeSeconds);

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          if (!timerSyncInFlight.current) {
            timerSyncInFlight.current = true;
            void syncSessionFromServer(session.sessionId)
              .catch((syncError) => {
                setError(
                  syncError instanceof ApiError
                    ? syncError.message
                    : 'Unable to sync the section timer.'
                );
              })
              .finally(() => {
                timerSyncInFlight.current = false;
              });
          }

          return 0;
        }

        return previousTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleVisibilityChange = () => {
      const sessionId = getCurrentSessionId();

      if (!sessionId) {
        return;
      }

      void syncSessionFromServer(sessionId).catch(() => {
        // Keep the current UI state if focus-based refresh fails.
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 60 && timeLeft > 0 && !showWarning) {
      setShowWarning(true);
    }
  }, [timeLeft, showWarning]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)]">
        <div className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm text-slate-600 shadow-sm">
          Restoring your test session...
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const sections = session.selectedSections;
  const currentSectionName = sections[session.currentSection];
  const sectionQuestions = getQuestionsForSection(session, session.currentSection);
  const currentQuestion = sectionQuestions[session.currentQuestionIndex];
  const pendingSectionName =
    session.pendingSectionIndex !== undefined && session.pendingSectionIndex !== null
      ? sections[session.pendingSectionIndex]
      : null;
  const totalSections = sections.length;
  const totalQuestions = getSelectedQuestions(session).length;
  const completedQuestionsBeforeCurrentSection = sections
    .slice(0, session.currentSection)
    .reduce((sum, section) => sum + (session.sectionQuestionCounts[section] ?? 0), 0);
  const totalProgress =
    totalQuestions > 0
      ? ((completedQuestionsBeforeCurrentSection + session.currentQuestionIndex + 1) /
          totalQuestions) *
        100
      : 0;
  const progress =
    sectionQuestions.length > 0
      ? ((session.currentQuestionIndex + 1) / sectionQuestions.length) * 100
      : 0;
  const isTimeLow = !session.isOnSectionBreak && timeLeft <= 300;

  const handleAnswerSelect = async (answer: AnswerOption) => {
    if (!session || !currentQuestion) {
      return;
    }

    setSelectedAnswer(answer);
    setError('');
    setIsSavingChoice(true);

    try {
      const updatedSession = await saveCandidateAnswer(session.sessionId, {
        sessionQuestionId: currentQuestion.sessionQuestionId,
        answer,
        currentQuestionIndex: session.currentQuestionIndex,
        currentSection: session.currentSection,
      });

      setSessionAndPersist(updatedSession);
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : 'Unable to save your answer right now.'
      );
    } finally {
      setIsSavingChoice(false);
    }
  };

  const handleNext = async () => {
    if (!session || !currentQuestion || !selectedAnswer || isSavingChoice) {
      return;
    }

    setError('');
    setIsWorking(true);

    try {
      const isLastQuestionInSection = session.currentQuestionIndex === sectionQuestions.length - 1;
      const isLastSection = session.currentSection === totalSections - 1;

      if (isLastQuestionInSection && isLastSection) {
        await saveCandidateAnswer(session.sessionId, {
          sessionQuestionId: currentQuestion.sessionQuestionId,
          answer: selectedAnswer,
          currentQuestionIndex: session.currentQuestionIndex,
          currentSection: session.currentSection,
        });
        const result = await completeCandidateSession(session.sessionId);
        finishWithResult(result);
        return;
      }

      const nextQuestionIndex = session.currentQuestionIndex + 1;
      const updatedSession = await saveCandidateAnswer(session.sessionId, {
        sessionQuestionId: currentQuestion.sessionQuestionId,
        answer: selectedAnswer,
        currentQuestionIndex: nextQuestionIndex,
        currentSection: session.currentSection,
      });

      setSessionAndPersist(updatedSession);
      setShowWarning(false);

      if (!updatedSession.isOnSectionBreak) {
        const nextQuestion = getQuestionsForSection(
          updatedSession,
          updatedSession.currentSection
        )[updatedSession.currentQuestionIndex];

        setSelectedAnswer(
          nextQuestion ? updatedSession.answers[nextQuestion.sessionQuestionId] ?? null : null
        );
      } else {
        setSelectedAnswer(null);
      }
    } catch (nextError) {
      setError(
        nextError instanceof ApiError
          ? nextError.message
          : 'Unable to continue right now.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  const moveToNextSection = async () => {
    if (!session) {
      return;
    }

    const nextSectionIndex = session.pendingSectionIndex ?? session.currentSection + 1;

    setError('');
    setIsWorking(true);

    try {
      const updatedSession = await advanceCandidateSection(session.sessionId, {
        nextSectionIndex,
      });

      setSessionAndPersist(updatedSession);
      setSelectedAnswer(null);
      setShowWarning(false);
    } catch (advanceError) {
      setError(
        advanceError instanceof ApiError
          ? advanceError.message
          : 'Unable to move to the next section right now.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  if (!session.isOnSectionBreak && !currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eff6ff_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Westend Diamond Training Academy"
                className="h-12 w-auto mr-6 "
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Active CBT Session
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Westend Diamond Training Academy
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {session.name} {session.surname} | {session.uin}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Section</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {session.currentSection + 1}/{sections.length} | {currentSectionName}
                </p>
              </div>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  isTimeLow
                    ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-cyan-200 bg-cyan-50 text-cyan-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] opacity-70">Time Left</p>
                    <p className="text-xl font-semibold font-mono">
                      {session.isOnSectionBreak ? 'Break' : formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                <span>Section Progress</span>
                <span>
                  Question {Math.min(session.currentQuestionIndex + 1, Math.max(sectionQuestions.length, 1))} of {Math.max(sectionQuestions.length, 1)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#0891b2_100%)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              Overall completion {totalProgress.toFixed(0)}%
            </div>
          </div>
        </div>
      </header>

      {showWarning && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4" />
            Less than 1 minute remains in this section. Review your choice and continue.
          </div>
        </div>
      )}

      {isOffline && (
        <div className="border-b border-cyan-200 bg-cyan-50">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-cyan-900">
            <WifiOff className="h-4 w-4" />
            Connection lost. Reconnect before continuing so your latest answer can sync with the server.
          </div>
        </div>
      )}

      {error && (
        <div className="border-b border-red-200 bg-red-50">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Current Course</p>
                <p className="text-sm text-slate-500">{currentSectionName}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {sections.map((section, index) => (
                <div
                  key={section}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    index === session.currentSection
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : index < session.currentSection
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{section}</span>
                    {index < session.currentSection ? <CheckCircle2 className="h-4 w-4" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-semibold text-slate-900">Instructions</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <li>Select one answer before continuing.</li>
              <li>The timer resets when a new section starts.</li>
              <li>Completed sections cannot be reopened.</li>
            </ul>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] md:p-8">
          {session.isOnSectionBreak && pendingSectionName ? (
            <div className="flex min-h-[420px] flex-col justify-center">
              <span className="w-fit rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                Section Break
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
                {currentSectionName} completed.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Take a short pause before the next course. When you are ready, continue to start{' '}
                <span className="font-semibold text-slate-900">{pendingSectionName}</span>.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{currentSectionName}</p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Next Course</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{pendingSectionName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Time allowed: {formatTime(session.sectionTimeLimits[pendingSectionName] ?? 0)}
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={moveToNextSection}
                  disabled={isWorking}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue to {pendingSectionName}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <>
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
                  {currentSectionName}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  Question {session.currentQuestionIndex + 1}
                </span>
              </div>

              <div className="mb-8">
                <p className="text-xl leading-9 text-slate-900 md:text-2xl">
                  {currentQuestion.question}
                </p>
                {currentQuestion.imageUrl ? (
                  <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-3">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question illustration"
                      className="max-h-[24rem] w-full rounded-[1.25rem] object-contain"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = currentQuestion[`option${option}`];
                  const isSelected = selectedAnswer === option;

                  return (
                    <button
                      key={option}
                      onClick={() => void handleAnswerSelect(option)}
                      disabled={isSavingChoice || isWorking}
                      className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                            isSelected
                              ? 'border-white/20 bg-white/10 text-white'
                              : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          {option}
                        </div>
                        <div className="pt-1 text-base leading-7">{optionText}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => void handleNext()}
                  disabled={!selectedAnswer || isSavingChoice || isWorking}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isWorking
                    ? 'Saving...'
                    : session.currentQuestionIndex === sectionQuestions.length - 1
                      ? session.currentSection === sections.length - 1
                        ? 'Finish Test'
                        : 'Review Next Course'
                      : 'Next Question'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
