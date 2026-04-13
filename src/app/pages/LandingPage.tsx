import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, AlertCircle, ShieldCheck, Clock3, BookOpenText } from 'lucide-react';
import logo from '../../assets/wednl-banner1-3.png';
import {
  validateUIN,
  markUINAsUsed,
  getQuestions,
  setCurrentSession,
  getSectionTimeLimits,
  getSectionQuestionCounts,
  getCurrentSession,
  getSubjectConfigs,
} from '../../utils/storage';
import { generateTestQuestions, getSections, getTotalConfiguredQuestions } from '../../utils/testUtils';

export default function LandingPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    uin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const currentSession = getCurrentSession();
  const subjectConfigs = useMemo(() => getSubjectConfigs(), []);
  const savedQuestionCounts = useMemo(() => getSectionQuestionCounts(), []);
  const sectionQuestionCounts = useMemo(
    () =>
      subjectConfigs.reduce((acc, subject) => {
        acc[subject.name] = savedQuestionCounts[subject.name] ?? subject.questions;
        return acc;
      }, {} as Record<string, number>),
    [savedQuestionCounts, subjectConfigs]
  );
  const totalConfiguredQuestions = useMemo(
    () => getTotalConfiguredQuestions(sectionQuestionCounts),
    [sectionQuestionCounts]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { name, surname, uin } = formData;

      if (!name.trim() || !surname.trim() || !uin.trim()) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const validUIN = validateUIN(uin.trim());
      if (!validUIN) {
        setError('Invalid or already used UIN code');
        setLoading(false);
        return;
      }

      const allQuestions = getQuestions();
      const validSections = validUIN.subjects && validUIN.subjects.length > 0 ? validUIN.subjects : getSections();

      const selectedQuestionCounts = validSections.reduce((acc, sectionName) => {
        acc[sectionName] = sectionQuestionCounts[sectionName] ?? 0;
        return acc;
      }, {} as Record<string, number>);

      const hasEnoughQuestionsPerSection = validSections.every((sectionName) => {
        const available = allQuestions.filter((question) => question.section === sectionName).length;
        return available >= (selectedQuestionCounts[sectionName] || 0);
      });

      if (!hasEnoughQuestionsPerSection) {
        setError('Question setup is incomplete for one or more courses. Please contact admin.');
        setLoading(false);
        return;
      }

      const selectedQuestions = generateTestQuestions(allQuestions, selectedQuestionCounts, uin.trim(), validSections);
      const savedSectionTimeLimits = getSectionTimeLimits();
      const sectionTimeLimits = validSections.reduce((acc, sectionName) => {
        acc[sectionName] = savedSectionTimeLimits[sectionName] ?? 0;
        return acc;
      }, {} as Record<string, number>);

      setCurrentSession({
        uin: uin.trim(),
        name: name.trim(),
        surname: surname.trim(),
        currentSection: 0,
        pendingSectionIndex: null,
        isOnSectionBreak: false,
        currentQuestionIndex: 0,
        answers: {},
        selectedQuestionIds: selectedQuestions.map((question) => question.id),
        selectedSections: validSections,
        sectionTimeLimits,
        sectionQuestionCounts: selectedQuestionCounts,
        startTime: new Date().toISOString(),
        sectionStartTime: new Date().toISOString(),
      });

      markUINAsUsed(uin.trim(), name.trim(), surname.trim());
      navigate('/test');
    } catch (submissionError) {
      console.error('Unable to start test session', submissionError);
      setError('Unable to start test on this device right now. Please refresh and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#111827_40%,#164e63_100%)] text-white">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_20%)]" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-12 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Westend Diamond Training Academy"
                className="h-16 w-auto rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50/95 via-white to-cyan-100/90 p-2 shadow-2xl"
              />
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm text-slate-100 backdrop-blur-xl">
                <GraduationCap className="h-4 w-4 text-cyan-300" />
                Westend Diamond Training Academy CBT
              </div>
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                A calmer, clearer test experience for students.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-200 md:text-lg">
                Start your exam with your registered UIN, follow each section step by step,
                and complete the assessment in a focused interface designed to reduce confusion.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <ShieldCheck className="h-6 w-6 text-emerald-300" />
                <p className="mt-4 text-sm font-semibold">Secure Access</p>
                <p className="mt-2 text-sm text-slate-200">Unique UIN entry for every candidate.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <BookOpenText className="h-6 w-6 text-cyan-300" />
                <p className="mt-4 text-sm font-semibold">{subjectConfigs.length} Exam Section{subjectConfigs.length === 1 ? '' : 's'}</p>
                <p className="mt-2 text-sm text-slate-200">Configured courses with admin-controlled question counts.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <Clock3 className="h-6 w-6 text-amber-300" />
                <p className="mt-4 text-sm font-semibold">Flexible Timers</p>
                <p className="mt-2 text-sm text-slate-200">Timers follow the latest admin course settings.</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/20 p-6 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
                Candidate Guide
              </p>
              <div className="mt-4 grid gap-4 text-sm text-slate-200 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Use your correct first name, surname, and active UIN before starting.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  You will receive a subset of the selected courses according to your UIN assignment.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Current Course Pool: {subjectConfigs.map((sub) => sub.name).join(', ')}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Each UIN receives its own randomized question sequence, so learners do not all get the same question order.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  The current exam setup contains {totalConfiguredQuestions} total questions.
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-left text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  Need admin access? Open the control portal.
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_40px_120px_-45px_rgba(15,23,42,0.8)] backdrop-blur-xl md:p-8">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Student Sign In
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Start your CBT session
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your details exactly as registered. Your UIN will be validated before the test opens.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-slate-700">
                    First Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="surname" className="mb-2 block text-sm text-slate-700">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    value={formData.surname}
                    onChange={(event) => setFormData({ ...formData, surname: event.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                    placeholder="Enter your surname"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="uin" className="mb-2 block text-sm text-slate-700">
                  Unique Identifier Number (UIN)
                </label>
                <input
                  id="uin"
                  type="text"
                  value={formData.uin}
                  onChange={(event) =>
                    setFormData({ ...formData, uin: event.target.value.toUpperCase() })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono outline-none transition focus:border-slate-900"
                  placeholder="TRN-XXXXXX"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Starting Test...' : 'Start Test'}
              </button>

              {currentSession ? (
                <button
                  type="button"
                  onClick={() => navigate('/test')}
                  className="w-full rounded-2xl border border-slate-300 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
