import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, AlertCircle, ShieldCheck, Clock3, BookOpenText } from 'lucide-react';
import logo from '../../assets/wednl-banner1-3.png';
import type { SubjectConfig, TestSession } from '../../types';
import { ApiError, getCandidateSession, listCandidateSubjects, startCandidateSession } from '../../utils/api';
import ThemeToggle from '../components/ThemeToggle';
import {
  clearCurrentSessionState,
  clearLatestResult,
  getCachedSession,
  getCurrentSessionId,
  setCurrentSessionState,
} from '../../utils/clientState';
import { getTotalConfiguredQuestions } from '../../utils/testUtils';

export default function LandingPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    uin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([]);
  const [currentSession, setCurrentSession] = useState<TestSession | null>(getCachedSession());

  useEffect(() => {
    const loadLandingData = async () => {
      try {
        const [subjects] = await Promise.all([listCandidateSubjects()]);
        setSubjectConfigs(
          subjects.map((subject) => ({
            ...subject,
            questionBankCount: 0,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          }))
        );

        const sessionId = getCurrentSessionId();

        if (!sessionId) {
          setCurrentSession(null);
          return;
        }

        try {
          const session = await getCandidateSession(sessionId);

          if (session.status === 'COMPLETED') {
            clearCurrentSessionState();
            setCurrentSession(null);
            return;
          }

          setCurrentSession(session);
          setCurrentSessionState(session);
        } catch {
          clearCurrentSessionState();
          setCurrentSession(null);
        }
      } catch (loadError) {
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : 'Unable to load the latest exam setup right now.'
        );
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadLandingData();
  }, []);

  const sectionQuestionCounts = useMemo(
    () =>
      subjectConfigs.reduce((acc, subject) => {
        acc[subject.name] = subject.questionCount;
        return acc;
      }, {} as Record<string, number>),
    [subjectConfigs]
  );

  const totalConfiguredQuestions = useMemo(
    () => getTotalConfiguredQuestions(sectionQuestionCounts),
    [sectionQuestionCounts]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { name, surname, uin } = formData;

      if (!name.trim() || !surname.trim() || !uin.trim()) {
        setError('Please fill in all fields');
        return;
      }

      const session = await startCandidateSession({
        name: name.trim(),
        surname: surname.trim(),
        uin: uin.trim().toUpperCase(),
      });

      clearLatestResult();
      setCurrentSessionState(session);
      setCurrentSession(session);
      navigate('/test');
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to start the test right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#ecfeff_45%,#f8fafc_100%)] text-slate-900 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_40%,#164e63_100%)] dark:text-white">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_20%)]" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-12 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <section className="space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={logo}
                  alt="Westend Diamond Training Academy"
                  className="h-16 w-auto rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50/95 via-white to-cyan-100/90 p-2 shadow-2xl dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/80"
                />
                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-sm text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:text-slate-100">
                  <GraduationCap className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  Westend Diamond Training Academy CBT
                </div>
              </div>
              <ThemeToggle className="shrink-0" />
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl dark:text-white">
                A calmer, clearer test experience for students.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg dark:text-slate-200">
                Start your exam with your registered UIN, follow each section step by step,
                and complete the assessment in a focused interface designed to reduce confusion.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200/70 bg-white/65 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                <ShieldCheck className="h-6 w-6 text-emerald-500 dark:text-emerald-300" />
                <p className="mt-4 text-sm font-semibold">Secure Access</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">Unique UIN entry for every candidate.</p>
              </div>
              <div className="rounded-3xl border border-slate-200/70 bg-white/65 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                <BookOpenText className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
                <p className="mt-4 text-sm font-semibold">{subjectConfigs.length} Exam Section{subjectConfigs.length === 1 ? '' : 's'}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">Configured courses with admin-controlled question counts.</p>
              </div>
              <div className="rounded-3xl border border-slate-200/70 bg-white/65 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                <Clock3 className="h-6 w-6 text-amber-500 dark:text-amber-300" />
                <p className="mt-4 text-sm font-semibold">Flexible Timers</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-200">Timers follow the latest admin course settings.</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/20">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
                Candidate Guide
              </p>
              <div className="mt-4 grid gap-4 text-sm text-slate-600 dark:text-slate-200 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  Use your correct first name, surname, and active UIN before starting.
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  You will receive a subset of the selected courses according to your UIN assignment.
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  Current Course Pool: {subjectConfigs.map((sub) => sub.name).join(', ') || 'No active courses yet'}
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  Questions and scoring now come from the backend, so resumes and results stay consistent.
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  The current exam setup contains {totalConfiguredQuestions} total configured questions.
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-left text-cyan-900 transition hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100 dark:hover:bg-cyan-400/15"
                >
                  Need admin access? Open the control portal.
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 text-slate-900 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-100 dark:shadow-[0_40px_120px_-45px_rgba(15,23,42,0.8)] md:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Student Sign In
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Start your CBT session
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Enter your details exactly as registered. Your UIN will be validated before the test opens.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-slate-700 dark:text-slate-300">
                    First Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="surname" className="mb-2 block text-sm text-slate-700 dark:text-slate-300">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    value={formData.surname}
                    onChange={(event) => setFormData({ ...formData, surname: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    placeholder="Enter your surname"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="uin" className="mb-2 block text-sm text-slate-700 dark:text-slate-300">
                  Unique Identifier Number (UIN)
                </label>
                <input
                  id="uin"
                  type="text"
                  value={formData.uin}
                  onChange={(event) =>
                    setFormData({ ...formData, uin: event.target.value.toUpperCase() })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                  placeholder="TRN-XXXXXX"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isBootstrapping}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Starting Test...' : isBootstrapping ? 'Loading Setup...' : 'Start Test'}
              </button>

              {currentSession ? (
                <button
                  type="button"
                  onClick={() => navigate('/test')}
                  className="w-full rounded-2xl border border-slate-300 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900/80"
                >
                  Resume Existing Test
                </button>
              ) : null}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
