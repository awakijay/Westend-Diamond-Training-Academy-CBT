import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Clock, ChevronRight, AlertCircle, BookOpen, CheckCircle2, WifiOff } from 'lucide-react';
import logo from '../../assets/wednl-banner1-3.png';
import {
  getCurrentSession,
  setCurrentSession,
  addResult,
} from '../../utils/storage';
import {
  getQuestionsForSection,
  getSections,
  formatTime,
  calculateSectionResults,
  calculateTotalScore,
} from '../../utils/testUtils';

const getRemainingSectionTime = (session: NonNullable<ReturnType<typeof getCurrentSession>>): number => {
  const sections = getSections();
  const currentSection = sections[session.currentSection];
  const sectionLimit = session.sectionTimeLimits[currentSection];
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(session.sectionStartTime).getTime()) / 1000)
  );

  return Math.max(0, sectionLimit - elapsedSeconds);
};

export default function TestPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(getCurrentSession());
  const [timeLeft, setTimeLeft] = useState(() => {
    const currentSession = getCurrentSession();
    if (!currentSession) {
      return 0;
    }

    return getRemainingSectionTime(currentSession);
  });
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }

    const currentQuestion = getQuestionsForSection(session, session.currentSection)[
      session.currentQuestionIndex
    ];

    if (currentQuestion && session.answers[currentQuestion.id]) {
      setSelectedAnswer(session.answers[currentQuestion.id]);
    } else {
      setSelectedAnswer(null);
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!session) return;

    const syncRemainingTime = () => {
      const remainingTime = getRemainingSectionTime(session);

      if (remainingTime <= 0) {
        handleAutoSubmit();
        return;
      }

      setTimeLeft(remainingTime);
    };

    syncRemainingTime();

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          handleAutoSubmit();
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
      const currentSession = getCurrentSession();
      if (!currentSession) {
        return;
      }

      setSession(currentSession);
      setTimeLeft(getRemainingSectionTime(currentSession));
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

  const handleAutoSubmit = () => {
    if (!session) return;

    if (session.currentSection < 4) {
      moveToNextSection();
    } else {
      completeTest();
    }
  };

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!session) return;

    const sectionQuestions = getQuestionsForSection(session, session.currentSection);
    const currentQuestion = sectionQuestions[session.currentQuestionIndex];
    const updatedSession = {
      ...session,
      answers: {
        ...session.answers,
        [currentQuestion.id]: answer,
      },
    };

    setSelectedAnswer(answer);
    setSession(updatedSession);
    setCurrentSession(updatedSession);
  };

  const handleNext = () => {
    if (!session || !selectedAnswer) return;

    const sectionQuestions = getQuestionsForSection(session, session.currentSection);
    const currentQuestion = sectionQuestions[session.currentQuestionIndex];

    const updatedSession = {
      ...session,
      answers: {
        ...session.answers,
        [currentQuestion.id]: selectedAnswer,
      },
    };

    if (session.currentQuestionIndex < sectionQuestions.length - 1) {
      updatedSession.currentQuestionIndex += 1;
      setSession(updatedSession);
      setCurrentSession(updatedSession);

      const nextQuestion = sectionQuestions[updatedSession.currentQuestionIndex];
      setSelectedAnswer(updatedSession.answers[nextQuestion.id] ?? null);
      return;
    }

    if (session.currentSection < 4) {
      const nextSectionIndex = updatedSession.currentSection + 1;
      const nextSection = getSections()[nextSectionIndex];
      updatedSession.currentSection += 1;
      updatedSession.currentQuestionIndex = 0;
      updatedSession.sectionStartTime = new Date().toISOString();
      setSession(updatedSession);
      setCurrentSession(updatedSession);
      setTimeLeft(updatedSession.sectionTimeLimits[nextSection]);
      setSelectedAnswer(null);
      setShowWarning(false);
      return;
    }

    setCurrentSession(updatedSession);
    completeTest();
  };

  const moveToNextSection = () => {
    if (!session) return;

    const nextSectionIndex = session.currentSection + 1;
    const nextSection = getSections()[nextSectionIndex];

    const updatedSession = {
      ...session,
      currentSection: nextSectionIndex,
      currentQuestionIndex: 0,
      sectionStartTime: new Date().toISOString(),
    };

    setSession(updatedSession);
    setCurrentSession(updatedSession);
    setTimeLeft(updatedSession.sectionTimeLimits[nextSection]);
    setSelectedAnswer(null);
    setShowWarning(false);
  };

  const completeTest = () => {
    if (!session) return;

    const sectionResults = calculateSectionResults(session);
    const totalScore = calculateTotalScore(sectionResults);

    addResult({
      id: Date.now().toString(),
      uin: session.uin,
      name: session.name,
      surname: session.surname,
      sectionResults,
      totalScore,
      totalQuestions: session.selectedQuestions.length,
      completedAt: new Date().toISOString(),
    });

    setCurrentSession(null);
    navigate('/results');
  };

  if (!session) {
    return null;
  }

  const sections = getSections();
  const currentSectionName = sections[session.currentSection];
  const sectionQuestions = getQuestionsForSection(session, session.currentSection);
  const currentQuestion = sectionQuestions[session.currentQuestionIndex];

  if (!currentQuestion) {
    return null;
  }

  const progress = ((session.currentQuestionIndex + 1) / sectionQuestions.length) * 100;
  const totalQuestions = session.selectedQuestions.length;
  const completedQuestionsBeforeCurrentSection = sections
    .slice(0, session.currentSection)
    .reduce((sum, section) => sum + session.sectionQuestionCounts[section], 0);
  const totalProgress =
    ((completedQuestionsBeforeCurrentSection + session.currentQuestionIndex + 1) / totalQuestions) * 100;
  const isTimeLow = timeLeft <= 300;

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
                  {session.currentSection + 1}/5 | {currentSectionName}
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
                    <p className="text-xl font-semibold font-mono">{formatTime(timeLeft)}</p>
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
                  Question {session.currentQuestionIndex + 1} of {sectionQuestions.length}
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
            Connection lost. Your progress is saved on this device and will continue when you return.
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
                <p className="text-sm font-semibold text-slate-900">Current Subject</p>
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
          </div>

          <div className="space-y-4">
            {(['A', 'B', 'C', 'D'] as const).map((option) => {
              const optionText = currentQuestion[`option${option}`];
              const isSelected = selectedAnswer === option;

              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  className={`w-full rounded-[1.5rem] border p-5 text-left transition ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                  }`}
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
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {session.currentQuestionIndex === sectionQuestions.length - 1
                ? session.currentSection === 4
                  ? 'Finish Test'
                  : 'Next Section'
                : 'Next Question'}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
