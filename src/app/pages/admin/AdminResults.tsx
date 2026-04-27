import { Fragment, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { format } from 'date-fns';
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Loader2,
  XCircle,
} from 'lucide-react';
import logo from '../../../assets/wednl-banner1-3.png';
import { getResult, listAllResults } from '../../../utils/api';
import { ResultAnswerReviewItem, TestResult } from '../../../types';
import {
  downloadCsv,
  getAcademicYear,
  getResultPercentage,
  getResultStatus,
  getSectionBreakdownLabel,
} from '../../../utils/reporting';

const answerOptions = ['A', 'B', 'C', 'D'] as const;

const getAnswerLabel = (
  answerReview: ResultAnswerReviewItem,
  option: (typeof answerOptions)[number]
) => {
  const optionText = getAnswerText(answerReview, option);

  return `${option}. ${optionText}`;
};

const getAnswerText = (
  answerReview: ResultAnswerReviewItem,
  option: (typeof answerOptions)[number]
) => {
  const optionTextByKey = {
    A: answerReview.optionA,
    B: answerReview.optionB,
    C: answerReview.optionC,
    D: answerReview.optionD,
  };

  return optionTextByKey[option];
};

export default function AdminResults() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [resultDetailsById, setResultDetailsById] = useState<Record<string, TestResult>>({});
  const [detailErrorsById, setDetailErrorsById] = useState<Record<string, string>>({});
  const [loadingDetailIds, setLoadingDetailIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);

      try {
        const response = await listAllResults({
          search: searchTerm || undefined,
          sortBy,
          sortOrder,
        });

        setResults(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load results.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadResults();
  }, [searchTerm, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'score' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (resultDetailsById[id] || loadingDetailIds[id]) {
      return;
    }

    setLoadingDetailIds((current) => ({ ...current, [id]: true }));
    setDetailErrorsById((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    void getResult(id)
      .then((detail) => {
        setResultDetailsById((current) => ({
          ...current,
          [id]: detail,
        }));
      })
      .catch((loadError) => {
        setDetailErrorsById((current) => ({
          ...current,
          [id]: loadError instanceof Error ? loadError.message : 'Unable to load answer review.',
        }));
      })
      .finally(() => {
        setLoadingDetailIds((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      });
  };

  const averagePercentage =
    results.length > 0
      ? (
          results.reduce((sum, result) => sum + getResultPercentage(result), 0) / results.length
        ).toFixed(1)
      : '0.0';

  const exportResultsCsv = () => {
    if (!results.length) return;
    const headers = ['Name', 'Surname', 'UIN', 'Academic Year', 'Score', 'Total Questions', 'Percentage', 'Status', 'Section Breakdown', 'Completed At'];
    const rows = results.map((r) => {
      const pct = getResultPercentage(r).toFixed(1);
      return [
        r.name,
        r.surname,
        r.uin,
        r.academicYear || getAcademicYear(r.completedAt),
        r.totalScore.toString(),
        r.totalQuestions.toString(),
        `${pct}%`,
        getResultStatus(r),
        getSectionBreakdownLabel(r),
        new Date(r.completedAt).toLocaleString(),
      ];
    });
    downloadCsv('admin-results.csv', headers, rows);
  };

  const exportResultsReport = () => {
    if (!results.length) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const rows = results
      .map((r) => {
        const pct = getResultPercentage(r).toFixed(1);
        return `<tr>
          <td>${r.name} ${r.surname}</td>
          <td>${r.uin}</td>
          <td>${r.academicYear || getAcademicYear(r.completedAt)}</td>
          <td>${r.totalScore}/${r.totalQuestions}</td>
          <td>${pct}%</td>
          <td>${getResultStatus(r)}</td>
          <td>${getSectionBreakdownLabel(r)}</td>
          <td>${new Date(r.completedAt).toLocaleString()}</td>
        </tr>`;
      })
      .join('');

    const avgPct = results.reduce((sum, result) => sum + getResultPercentage(result), 0) / results.length;

    win.document.write(`
      <html>
        <head>
          <title>Results Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 22px; }
            .pill { display: inline-block; margin-right: 8px; padding: 6px 10px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background: #f8fafc; }
            footer { margin-top: 24px; font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <header>
            <img src="${logo}" alt="Academy Logo" style="height:60px;border-radius:8px;" />
            <div>
              <h1>Results Report</h1>
              <div>
                <span class="pill">Total Tests: ${results.length}</span>
                <span class="pill">Avg Score: ${avgPct.toFixed(1)}%</span>
              </div>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>UIN</th>
                <th>Academic Year</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Section Breakdown</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <footer>Generated on ${new Date().toLocaleString()} | Westend Diamond Training Academy CBT</footer>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl">Test Results</h1>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Total Tests: {results.length} | Average Score: {averagePercentage}%
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportResultsCsv}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Export CSV
            </button>
            <button
              onClick={exportResultsReport}
              className="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
            >
              Export PDF
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, surname, or UIN..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:border-transparent focus:ring-2 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-900/90">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Student
                      {sortBy === 'name' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">UIN</th>
                  <th className="px-4 py-3 text-left">Academic Year</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Score
                      {sortBy === 'score' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Percentage</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Completed
                      {sortBy === 'date' &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                      Loading results...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                      {searchTerm ? 'No results found' : 'No test results available'}
                    </td>
                  </tr>
                ) : (
                  results.map((result) => {
                    const percentage = getResultPercentage(result).toFixed(1);
                    const isExpanded = expandedId === result.id;
                    const detailedResult = resultDetailsById[result.id];
                    const answerReview = detailedResult?.answerReview ?? [];
                    const answerReviewBySection = answerReview.reduce(
                      (acc, answer) => {
                        acc[answer.section] = [...(acc[answer.section] ?? []), answer];
                        return acc;
                      },
                      {} as Record<string, ResultAnswerReviewItem[]>
                    );
                    const correctAnswersCount = answerReview.filter((answer) => answer.isCorrect).length;
                    const unansweredCount = answerReview.filter((answer) => !answer.isAnswered).length;
                    const wrongAnswersCount =
                      answerReview.length - correctAnswersCount - unansweredCount;

                    return (
                      <Fragment key={result.id}>
                        <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/70">
                          <td className="px-4 py-3">
                            {result.name} {result.surname}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">
                            {result.uin}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                            {result.academicYear || getAcademicYear(result.completedAt)}
                          </td>
                          <td className="px-4 py-3">
                            {result.totalScore}/{result.totalQuestions}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${
                                parseFloat(percentage) >= 50
                                  ? 'bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                                  : 'bg-red-100 text-red-700 dark:bg-rose-500/10 dark:text-rose-200'
                              }`}
                            >
                              {percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {getResultStatus(result)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                            {format(
                              new Date(result.completedAt),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleExpand(result.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-cyan-300 dark:hover:text-cyan-200"
                            >
                              {isExpanded ? 'Hide answers' : 'View answers'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="bg-gray-50 px-4 py-4 dark:bg-slate-900/70">
                              <div className="space-y-6">
                                <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                    <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      Student Summary
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                          Student
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                          {result.name} {result.surname}
                                        </p>
                                        <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-400">
                                          {result.uin}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                          Completed
                                        </p>
                                        <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                          {format(new Date(result.completedAt), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                          {result.totalScore}/{result.totalQuestions} overall score
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                    <div className="flex items-center justify-between gap-3">
                                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Answer Review Summary
                                      </h4>
                                      {loadingDetailIds[result.id] ? (
                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          Loading answers
                                        </span>
                                      ) : answerReview.length > 0 ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          {answerReview.length} question{answerReview.length === 1 ? '' : 's'}
                                        </span>
                                      ) : null}
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                      <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
                                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
                                          Correct
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-100">
                                          {correctAnswersCount}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-500/10">
                                        <p className="text-xs uppercase tracking-[0.18em] text-rose-700 dark:text-rose-200">
                                          Wrong
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold text-rose-800 dark:text-rose-100">
                                          {wrongAnswersCount}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10">
                                        <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
                                          Unanswered
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold text-amber-800 dark:text-amber-100">
                                          {unansweredCount}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Section Breakdown
                                  </h4>
                                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {result.sectionResults.map((section, index) => {
                                      const sectionPercentage = (
                                        section.percentage ??
                                        (section.total ? (section.score / section.total) * 100 : 0)
                                      ).toFixed(0);

                                      return (
                                        <div
                                          key={index}
                                          className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                                        >
                                          <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                              {section.section}
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                              {section.score}/{section.total}
                                            </span>
                                          </div>
                                          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
                                            <div
                                              className="h-full bg-indigo-600 dark:bg-cyan-400"
                                              style={{
                                                width: `${sectionPercentage}%`,
                                              }}
                                            />
                                          </div>
                                          <div className="mt-1 text-right text-xs text-gray-600 dark:text-slate-400">
                                            {sectionPercentage}%
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {detailErrorsById[result.id] ? (
                                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <span>{detailErrorsById[result.id]}</span>
                                  </div>
                                ) : loadingDetailIds[result.id] ? (
                                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Loading the student answer review...
                                  </div>
                                ) : answerReview.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                                    No answer review is available for this student yet.
                                  </div>
                                ) : (
                                  <div className="space-y-5">
                                    {Object.entries(answerReviewBySection).map(([sectionName, sectionAnswers]) => (
                                      <div key={sectionName} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                          <div>
                                            <h5 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                              {sectionName}
                                            </h5>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                              {sectionAnswers.length} question{sectionAnswers.length === 1 ? '' : 's'} reviewed
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                              Correct: {sectionAnswers.filter((answer) => answer.isCorrect).length}
                                            </span>
                                            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                              Wrong: {sectionAnswers.filter((answer) => answer.isAnswered && !answer.isCorrect).length}
                                            </span>
                                            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                                              Unanswered: {sectionAnswers.filter((answer) => !answer.isAnswered).length}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          {sectionAnswers.map((answer) => (
                                            <article
                                              key={answer.id}
                                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                                            >
                                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="max-w-4xl">
                                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                                    Question {answer.questionOrder + 1}
                                                  </p>
                                                  <h6 className="mt-2 text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
                                                    {answer.question}
                                                  </h6>
                                                </div>

                                                <div>
                                                  {answer.isAnswered ? (
                                                    answer.isCorrect ? (
                                                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Correct
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                                        <XCircle className="h-4 w-4" />
                                                        Wrong
                                                      </span>
                                                    )
                                                  ) : (
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                                                      <CircleDashed className="h-4 w-4" />
                                                      Unanswered
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              {answer.imageUrl ? (
                                                <img
                                                  src={answer.imageUrl}
                                                  alt={`Illustration for question ${answer.questionOrder + 1}`}
                                                  className="mt-4 max-h-56 rounded-2xl border border-slate-200 object-contain dark:border-slate-700"
                                                />
                                              ) : null}

                                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                {answerOptions.map((option) => {
                                                  const isSelected = answer.selectedAnswer === option;
                                                  const isCorrectOption = answer.correctAnswer === option;

                                                  return (
                                                    <div
                                                      key={option}
                                                      className={`rounded-2xl border p-3 ${
                                                        isCorrectOption
                                                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                                                          : isSelected
                                                            ? 'border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
                                                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950'
                                                      }`}
                                                    >
                                                      <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                          Option {option}
                                                        </span>
                                                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                                                          {isSelected ? (
                                                            <span className="rounded-full bg-slate-900 px-2 py-1 text-white dark:bg-slate-200 dark:text-slate-950">
                                                              Picked
                                                            </span>
                                                          ) : null}
                                                          {isCorrectOption ? (
                                                            <span className="rounded-full bg-emerald-600 px-2 py-1 text-white dark:bg-emerald-400 dark:text-slate-950">
                                                              Correct
                                                            </span>
                                                          ) : null}
                                                        </div>
                                                      </div>
                                                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                        {getAnswerText(answer, option)}
                                                      </p>
                                                    </div>
                                                  );
                                                })}
                                              </div>

                                              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <span>
                                                  Student answer:{' '}
                                                  <strong className="text-slate-900 dark:text-slate-100">
                                                    {answer.selectedAnswer
                                                      ? getAnswerLabel(answer, answer.selectedAnswer)
                                                      : 'No answer submitted'}
                                                  </strong>
                                                </span>
                                                <span>
                                                  Correct answer:{' '}
                                                  <strong className="text-slate-900 dark:text-slate-100">
                                                    {getAnswerLabel(answer, answer.correctAnswer)}
                                                  </strong>
                                                </span>
                                              </div>
                                            </article>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
