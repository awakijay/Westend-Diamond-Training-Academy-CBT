import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, GraduationCap, Home } from 'lucide-react';
import type { TestResult } from '../../types';
import { getLatestResult } from '../../utils/clientState';
import ThemeToggle from '../components/ThemeToggle';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const latestResult = getLatestResult();

    if (!latestResult) {
      navigate('/');
      return;
    }

    setResult(latestResult);
  }, [navigate]);

  if (!result) {
    return null;
  }

  const percentage = result.percentage.toFixed(1);
  const isPassing = result.status === 'Pass';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:border dark:border-slate-800 dark:bg-slate-950/75 dark:shadow-[0_20px_80px_-35px_rgba(8,145,178,0.35)]">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                isPassing ? 'bg-green-100 dark:bg-emerald-500/10' : 'bg-blue-100 dark:bg-cyan-500/10'
              }`}
            >
              {isPassing ? (
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-emerald-300" />
              ) : (
                <GraduationCap className="w-10 h-10 text-blue-600 dark:text-cyan-300" />
              )}
            </div>
            <h1 className="text-3xl mb-2">Test Completed!</h1>
            <p className="text-gray-600 dark:text-slate-400">
              {result.name} {result.surname}
            </p>
          </div>

          <div className="mb-6 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center">
              <p className="mb-2 text-gray-600 dark:text-slate-400">Overall Score</p>
              <p className="text-5xl mb-2">
                {result.totalScore}/{result.totalQuestions}
              </p>
              <p className="text-2xl text-indigo-600 dark:text-cyan-300">{percentage}%</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-xl mb-4">Section Breakdown</h2>
            {result.sectionResults.map((section, index) => {
              const sectionPercentage = (
                section.percentage ?? (section.total ? (section.score / section.total) * 100 : 0)
              ).toFixed(0);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-900/70"
                >
                  <div className="flex-1">
                    <p className="mb-2">{section.section}</p>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-indigo-600 transition-all dark:bg-cyan-400"
                        style={{ width: `${sectionPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-xl">
                      {section.score}/{section.total}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{sectionPercentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-slate-800">
            <button
              onClick={() => navigate('/')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-white transition hover:bg-indigo-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
            <p>
              Test completed on{' '}
              {new Date(result.completedAt).toLocaleString()}
            </p>
            <p className="mt-1">UIN: {result.uin}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
