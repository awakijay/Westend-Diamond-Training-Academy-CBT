import { useMemo, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  FileQuestion,
  Ticket,
  Users,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CircleDashed,
} from 'lucide-react';
import {
  getAcademicYearAnalytics,
  getQuestionResponseAnalytics,
  listAllQuestions,
  listAllResults,
  listSubjects,
  listUins,
  restoreDefaultData,
} from '../../../utils/api';
import type {
  AcademicYearAnalytics,
  Question,
  QuestionResponseAnalyticsItem,
  QuestionResponseRespondent,
  SubjectConfig,
  TestResult,
  UIN,
} from '../../../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Link } from 'react-router';
import logo from '../../../assets/wednl-banner1-3.png';
import { clearClientTrainingData, syncClientDataVersion } from '../../../utils/clientState';
import {
  downloadCsv,
  getAcademicYear,
  getResultPercentage,
  getResultStatus,
  getSectionBreakdownLabel,
} from '../../../utils/reporting';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatRespondentLabel = (respondent: QuestionResponseRespondent) =>
  respondent.uin ? `${respondent.fullName} (${respondent.uin})` : respondent.fullName;

const formatRespondentList = (respondents: QuestionResponseRespondent[]) =>
  respondents.length > 0 ? respondents.map(formatRespondentLabel).join('; ') : 'None';

const getQuestionOptionText = (
  item: QuestionResponseAnalyticsItem,
  option: 'A' | 'B' | 'C' | 'D'
) => {
  const optionTextByKey = {
    A: item.optionA,
    B: item.optionB,
    C: item.optionC,
    D: item.optionD,
  };

  return optionTextByKey[option];
};

const getQuestionOptionLabel = (
  item: QuestionResponseAnalyticsItem,
  option: 'A' | 'B' | 'C' | 'D'
) => `${option}. ${getQuestionOptionText(item, option)}`;

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [uins, setUINs] = useState<UIN[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [analytics, setAnalytics] = useState<AcademicYearAnalytics[]>([]);
  const [questionResponseAnalytics, setQuestionResponseAnalytics] = useState<
    QuestionResponseAnalyticsItem[]
  >([]);
  const [questionAnalyticsSearch, setQuestionAnalyticsSearch] = useState('');
  const [expandedQuestionAnalyticsId, setExpandedQuestionAnalyticsId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{
    message: string;
    tone: 'error' | 'success' | 'warning';
  } | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);

    try {
      const [
        subjectsResponse,
        questionsResponse,
        uinsResponse,
        resultsResponse,
        analyticsResponse,
        questionResponseAnalyticsResponse,
      ] = await Promise.all([
        listSubjects(),
        listAllQuestions(),
        listUins({ status: 'all' }),
        listAllResults(),
        getAcademicYearAnalytics(),
        getQuestionResponseAnalytics(),
      ]);

      setSubjects(subjectsResponse);
      setQuestions(questionsResponse);
      setUINs(uinsResponse.items);
      setResults(resultsResponse);
      setAnalytics(analyticsResponse);
      setQuestionResponseAnalytics(questionResponseAnalyticsResponse.items);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleRestoreDefault = async () => {
    setIsResetting(true);
    setNotice(null);

    try {
      const response = await restoreDefaultData();
      const {
        auditLogsCleared,
        questionsCleared,
        resultsCleared,
        sessionsCleared,
        subjectsCleared,
        uinsCleared,
        uploadFilesCleared,
      } = response.summary;

      clearClientTrainingData();
      syncClientDataVersion(response.dataVersion);

      setSubjects([]);
      setQuestions([]);
      setUINs([]);
      setResults([]);
      setAnalytics([]);
      setQuestionResponseAnalytics([]);
      setExpandedQuestionAnalyticsId(null);
      setError('');
      setIsResetDialogOpen(false);

      const summaryMessage = `Default data restored. Cleared ${subjectsCleared} course${subjectsCleared === 1 ? '' : 's'}, ${questionsCleared} question${questionsCleared === 1 ? '' : 's'}, ${uinsCleared} UIN${uinsCleared === 1 ? '' : 's'}, ${sessionsCleared} session${sessionsCleared === 1 ? '' : 's'}, ${resultsCleared} result${resultsCleared === 1 ? '' : 's'}, ${auditLogsCleared} audit log${auditLogsCleared === 1 ? '' : 's'}, and ${uploadFilesCleared} uploaded file${uploadFilesCleared === 1 ? '' : 's'}.`;

      setNotice({
        message: response.warning ? `${summaryMessage} ${response.warning}` : summaryMessage,
        tone: response.warning ? 'warning' : 'success',
      });
    } catch (resetError) {
      setNotice({
        message:
          resetError instanceof Error
            ? resetError.message
            : 'Unable to restore the default data right now.',
        tone: 'error',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const exportAnalyticsToCsv = () => {
    const headers = ['Academic Year', 'Total Tests', 'Passed', 'Failed', 'Pass Rate', 'Average Score'];
    const rows = analytics.map((item) => [
      item.academicYear,
      item.totalTests.toString(),
      item.passed.toString(),
      item.failed.toString(),
      `${item.passRate.toFixed(1)}%`,
      `${item.averageScore.toFixed(1)}%`,
    ]);

    downloadCsv('academic-year-analytics.csv', headers, rows);
  };

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
    downloadCsv('detailed-results.csv', headers, rows);
  };

  const exportResultsReport = () => {
    if (!results.length) return;
    const win = window.open('', '_blank');
    if (!win) return;

    const rows = results
      .map((r) => {
        const pct = getResultPercentage(r).toFixed(1);
        const year = r.academicYear || getAcademicYear(r.completedAt);
        return `<tr>
          <td>${r.name} ${r.surname}</td>
          <td>${r.uin}</td>
          <td>${year}</td>
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

  const exportAnalyticsReport = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const summaryPassRate = overallPassRate.toFixed(1);
    const summaryAvgScore = averageScore.toFixed(1);
    const summaryTrend = analytics.length > 1 ? 'Multi-year trend included.' : 'Single-year snapshot.';

    const rows = analytics
      .map((item) => `<tr>
          <td>${item.academicYear}</td>
          <td>${item.totalTests}</td>
          <td>${item.passed}</td>
          <td>${item.failed}</td>
          <td>${item.passRate.toFixed(1)}%</td>
          <td>${item.averageScore.toFixed(1)}%</td>
        </tr>`)
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>Academic Year Analytics Report</title>
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
              <h1>Academic Year Analytics</h1>
              <div>
                <span class="pill">Pass Rate: ${summaryPassRate}%</span>
                <span class="pill">Avg Score: ${summaryAvgScore}%</span>
                <span class="pill">${summaryTrend}</span>
              </div>
            </div>
          </header>
          <p style="margin-bottom:12px;">Insight: ${summaryPassRate < 60 ? 'Training focus needed - less than 60% pass rate.' : 'Great progress - majority of learners are passing.'}</p>
          <table>
            <thead>
              <tr>
                <th>Academic Year</th>
                <th>Total Tests</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Pass Rate</th>
                <th>Average Score</th>
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

  const filteredQuestionResponseAnalytics = useMemo(() => {
    const query = questionAnalyticsSearch.trim().toLowerCase();

    if (!query) {
      return questionResponseAnalytics;
    }

    return questionResponseAnalytics.filter((item) =>
      [item.subjectName, item.question].join(' ').toLowerCase().includes(query)
    );
  }, [questionAnalyticsSearch, questionResponseAnalytics]);

  const filteredQuestionResponseAnalyticsSummary = useMemo(
    () => ({
      questionsCovered: filteredQuestionResponseAnalytics.length,
      totalResponses: filteredQuestionResponseAnalytics.reduce(
        (sum, item) => sum + item.totalResponses,
        0
      ),
      answeredResponses: filteredQuestionResponseAnalytics.reduce(
        (sum, item) => sum + item.answeredCount,
        0
      ),
      correctResponses: filteredQuestionResponseAnalytics.reduce(
        (sum, item) => sum + item.correctCount,
        0
      ),
      incorrectResponses: filteredQuestionResponseAnalytics.reduce(
        (sum, item) => sum + item.incorrectCount,
        0
      ),
      unansweredResponses: filteredQuestionResponseAnalytics.reduce(
        (sum, item) => sum + item.unansweredCount,
        0
      ),
    }),
    [filteredQuestionResponseAnalytics]
  );

  const toggleQuestionAnalytics = (questionId: string) => {
    setExpandedQuestionAnalyticsId((current) =>
      current === questionId ? null : questionId
    );
  };

  const exportQuestionResponseAnalyticsCsv = () => {
    if (!filteredQuestionResponseAnalytics.length) {
      return;
    }

    const headers = [
      'Course',
      'Question',
      'Correct Answer',
      'Total Responses',
      'Answered',
      'Correct Count',
      'Wrong Count',
      'Unanswered Count',
      'Correct Rate',
      'Option A Count',
      'Option A Learners',
      'Option B Count',
      'Option B Learners',
      'Option C Count',
      'Option C Learners',
      'Option D Count',
      'Option D Learners',
      'Unanswered Learners',
      'Correct Learners',
      'Wrong Learners',
    ];

    const rows = filteredQuestionResponseAnalytics.map((item) => {
      const optionBreakdownByOption = new Map(
        item.optionBreakdown.map((entry) => [entry.option, entry])
      );

      return [
        item.subjectName,
        item.question,
        getQuestionOptionLabel(item, item.correctAnswer),
        item.totalResponses.toString(),
        item.answeredCount.toString(),
        item.correctCount.toString(),
        item.incorrectCount.toString(),
        item.unansweredCount.toString(),
        `${item.correctRate.toFixed(1)}%`,
        String(optionBreakdownByOption.get('A')?.count ?? 0),
        formatRespondentList(optionBreakdownByOption.get('A')?.respondents ?? []),
        String(optionBreakdownByOption.get('B')?.count ?? 0),
        formatRespondentList(optionBreakdownByOption.get('B')?.respondents ?? []),
        String(optionBreakdownByOption.get('C')?.count ?? 0),
        formatRespondentList(optionBreakdownByOption.get('C')?.respondents ?? []),
        String(optionBreakdownByOption.get('D')?.count ?? 0),
        formatRespondentList(optionBreakdownByOption.get('D')?.respondents ?? []),
        formatRespondentList(optionBreakdownByOption.get('UNANSWERED')?.respondents ?? []),
        formatRespondentList(item.correctRespondents),
        formatRespondentList(item.incorrectRespondents),
      ];
    });

    downloadCsv('question-response-analytics.csv', headers, rows);
  };

  const exportQuestionResponseAnalyticsReport = () => {
    if (!filteredQuestionResponseAnalytics.length) {
      return;
    }

    const win = window.open('', '_blank');

    if (!win) {
      return;
    }

    const questionSections = filteredQuestionResponseAnalytics
      .map((item) => {
        const optionRows = item.optionBreakdown
          .map(
            (option) => `<tr>
              <td>${escapeHtml(option.label)}</td>
              <td>${option.count}</td>
              <td>${escapeHtml(formatRespondentList(option.respondents))}</td>
            </tr>`
          )
          .join('');

        return `<section class="question-card">
          <div class="question-head">
            <div>
              <p class="eyebrow">${escapeHtml(item.subjectName)}</p>
              <h2>${escapeHtml(item.question)}</h2>
            </div>
            <div class="meta-group">
              <span class="pill">Responses: ${item.totalResponses}</span>
              <span class="pill success">Correct: ${item.correctCount}</span>
              <span class="pill danger">Wrong: ${item.incorrectCount}</span>
              <span class="pill warning">Unanswered: ${item.unansweredCount}</span>
            </div>
          </div>

          <p class="subtle">Correct answer: ${escapeHtml(
            getQuestionOptionLabel(item, item.correctAnswer)
          )} | Correct rate: ${item.correctRate.toFixed(1)}%</p>

          <table>
            <thead>
              <tr>
                <th>Option</th>
                <th>Count</th>
                <th>Learners</th>
              </tr>
            </thead>
            <tbody>${optionRows}</tbody>
          </table>

          <div class="summary-grid">
            <div class="summary-card success">
              <h3>Correct Learners (${item.correctRespondents.length})</h3>
              <p>${escapeHtml(formatRespondentList(item.correctRespondents))}</p>
            </div>
            <div class="summary-card danger">
              <h3>Wrong Learners (${item.incorrectRespondents.length})</h3>
              <p>${escapeHtml(formatRespondentList(item.incorrectRespondents))}</p>
            </div>
            <div class="summary-card warning">
              <h3>Unanswered (${item.unansweredRespondents.length})</h3>
              <p>${escapeHtml(formatRespondentList(item.unansweredRespondents))}</p>
            </div>
          </div>
        </section>`;
      })
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>Question Response Analytics</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 24px; }
            h2 { margin: 8px 0 0; font-size: 18px; }
            h3 { margin: 0 0 8px; font-size: 14px; }
            .eyebrow { margin: 0; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b; }
            .subtle { font-size: 13px; color: #475569; }
            .pill { display: inline-block; margin-right: 8px; margin-top: 8px; padding: 6px 10px; border-radius: 999px; background: #e2e8f0; color: #0f172a; font-size: 12px; }
            .pill.success { background: #dcfce7; color: #166534; }
            .pill.danger { background: #fee2e2; color: #b91c1c; }
            .pill.warning { background: #fef3c7; color: #92400e; }
            .question-card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; margin-top: 18px; page-break-inside: avoid; }
            .question-head { display: flex; gap: 16px; justify-content: space-between; align-items: flex-start; }
            .meta-group { text-align: right; min-width: 220px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
            th { background: #f8fafc; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
            .summary-card { border-radius: 16px; padding: 12px; }
            .summary-card.success { background: #f0fdf4; }
            .summary-card.danger { background: #fef2f2; }
            .summary-card.warning { background: #fffbeb; }
            footer { margin-top: 24px; font-size: 12px; color: #475569; }
          </style>
        </head>
        <body>
          <header>
            <img src="${logo}" alt="Academy Logo" style="height:60px;border-radius:8px;" />
            <div>
              <h1>Question Response Analytics</h1>
              <div>
                <span class="pill">Questions: ${filteredQuestionResponseAnalytics.length}</span>
                <span class="pill success">Correct: ${filteredQuestionResponseAnalyticsSummary.correctResponses}</span>
                <span class="pill danger">Wrong: ${filteredQuestionResponseAnalyticsSummary.incorrectResponses}</span>
                <span class="pill warning">Unanswered: ${filteredQuestionResponseAnalyticsSummary.unansweredResponses}</span>
              </div>
            </div>
          </header>
          <p class="subtle">This report shows how learners responded to each question, including who chose the correct option and who picked other options.</p>
          ${questionSections}
          <footer>Generated on ${new Date().toLocaleString()} | Westend Diamond Training Academy CBT</footer>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const questionsBySection = subjects.reduce((acc, subject) => {
    acc[subject.name] = questions.filter((question) => question.subjectId === subject.id).length;
    return acc;
  }, {} as Record<string, number>);
  const hasAnyQuestions = questions.length > 0 && Object.values(questionsBySection).some((count) => count > 0);

  const availableUINs = uins.filter((u) => u.status === 'AVAILABLE' && !u.used).length;
  const usedUINs = uins.filter((u) => u.used).length;
  const totalTests = results.length;
  const totalPassed = results.filter((r) => getResultPercentage(r) >= 50).length;
  const overallPassRate = totalTests ? (totalPassed / totalTests) * 100 : 0;
  const averageScore = totalTests
    ? results.reduce((sum, result) => sum + getResultPercentage(result), 0) / totalTests
    : 0;
  const headlineMessage =
    overallPassRate < 60
      ? 'Coaching focus recommended - pass rate below 60%.'
      : overallPassRate < 80
        ? 'Solid progress - keep reinforcing key topics.'
        : 'Excellent performance - maintain current training approach.';

  const pieData = useMemo(() => {
    const totalPass = analytics.reduce((sum, row) => sum + row.passed, 0);
    const totalFail = analytics.reduce((sum, row) => sum + row.failed, 0);
    return [
      { name: 'Passed', value: totalPass },
      { name: 'Failed', value: totalFail },
    ].filter((item) => item.value > 0);
  }, [analytics]);

  const stats = [
    {
      icon: FileQuestion,
      label: 'Total Questions',
      value: questions.length,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Ticket,
      label: 'Available UINs',
      value: availableUINs,
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Users,
      label: 'Tests Completed',
      value: results.length,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: CheckCircle,
      label: 'Used UINs',
      value: usedUINs,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Monitor exam activity and reset the platform when you need a clean production-ready start.
            </p>
          </div>

          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15">
                <RotateCcw className="h-4 w-4" />
                Restore Default
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Restore the CBT to its default data state?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently clear all courses, questions, UINs, test sessions, results, audit logs, and uploaded question images from the backend.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                Candidate session/result cache in the current browser will be cleared immediately, and other browsers will clear stale cached exam data the next time they load the app.
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                <button
                  type="button"
                  onClick={() => void handleRestoreDefault()}
                  disabled={isResetting}
                  className="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResetting ? 'Restoring...' : 'Yes, Restore Default'}
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {notice ? (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
              notice.tone === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                : notice.tone === 'warning'
                  ? 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
                  : 'border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
            }`}
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span>{notice.message}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            Loading dashboard data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">{stat.label}</p>
                        <p className="text-3xl">{stat.value}</p>
                      </div>
                      <div className={`rounded-lg p-3 ${stat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
                <h2 className="text-xl mb-4">Questions by Section</h2>
                {hasAnyQuestions ? (
                  <div className="space-y-3">
                    {Object.entries(questionsBySection).map(([section, count]) => (
                      <div key={section} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-slate-200">{section}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-slate-800 dark:text-slate-200">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">No courses/questions yet.</p>
                    <p className="mt-1">Add courses and questions to populate this view.</p>
                    <Link
                      to="/admin/questions"
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                    >
                      Add Courses & Questions
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl">Recent Test Results</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Exports live here</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={exportResultsCsv}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Export Results CSV
                    </button>
                    <button
                      onClick={exportResultsReport}
                      className="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      Export Results PDF
                    </button>
                  </div>
                </div>
                {results.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">No tests completed yet</p>
                ) : (
                  <div className="space-y-3">
                    {results.slice(-5).reverse().map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-slate-900/70"
                      >
                        <div>
                          <p>
                            {result.name} {result.surname}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">{result.uin}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg">
                            {result.totalScore}/{result.totalQuestions}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {getResultPercentage(result).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Performance Pulse</p>
                  <h2 className="text-2xl font-semibold tracking-tight">Academic Year Analytics</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{headlineMessage}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportAnalyticsToCsv}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Export Analytics CSV
                  </button>
                  <button
                    onClick={exportAnalyticsReport}
                    className="rounded-full bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                  >
                    Export Report PDF
                  </button>
                </div>
              </div>

              {analytics.length === 0 ? (
                <p className="mt-4 text-gray-500 dark:text-slate-400">No results data available to show analytics.</p>
              ) : (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overall Pass Rate</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{overallPassRate.toFixed(1)}%</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Across all academic years</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Average Score</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{averageScore.toFixed(1)}%</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Mean of all completed tests</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total Tests</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{totalTests}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Learners assessed</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {analytics.map((item) => {
                      const barPass = item.totalTests ? (item.passed / item.totalTests) * 100 : 0;
                      const barFail = item.totalTests ? (item.failed / item.totalTests) * 100 : 0;

                      return (
                        <div key={item.academicYear} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Academic Year</p>
                              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.academicYear}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 dark:text-slate-400">Pass Rate</p>
                              <p className="text-xl font-semibold">{item.passRate.toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="flex h-full w-full overflow-hidden rounded-full">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${barPass}%` }}
                                aria-label="Pass bar"
                              />
                              <div
                                className="h-full bg-rose-500"
                                style={{ width: `${barFail}%` }}
                                aria-label="Fail bar"
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Pass: {item.passed}</span>
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">Fail: {item.failed}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Total: {item.totalTests}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {pieData.length > 0 && (
                    <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Pass vs Fail (All Years)</p>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={50}
                                paddingAngle={2}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {pieData.map((entry) => (
                                  <Cell
                                    key={entry.name}
                                    fill={entry.name === 'Passed' ? '#22c55e' : '#ef4444'}
                                    stroke="white"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Key Takeaway</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {overallPassRate < 60
                            ? 'The proportion of passes is low - consider targeted revision for weaker areas.'
                            : overallPassRate < 80
                              ? 'Pass share is healthy; continue reinforcing core topics.'
                              : 'Strong pass share across years - maintain current training cadence.'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_20px_60px_-45px_rgba(8,145,178,0.35)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Teaching Insight
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Question Response Analytics
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Review how learners answered each question, see who picked the correct option,
                    and spot the distractors that are catching the most students.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={exportQuestionResponseAnalyticsCsv}
                    disabled={!filteredQuestionResponseAnalytics.length}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Export Question CSV
                  </button>
                  <button
                    onClick={exportQuestionResponseAnalyticsReport}
                    disabled={!filteredQuestionResponseAnalytics.length}
                    className="rounded-full bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export Question PDF
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={questionAnalyticsSearch}
                    onChange={(event) => setQuestionAnalyticsSearch(event.target.value)}
                    placeholder="Search by course or question text..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                  />
                </div>
              </div>

              {questionResponseAnalytics.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                  No completed question responses are available yet.
                </p>
              ) : filteredQuestionResponseAnalytics.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                  No question analytics matched your search.
                </p>
              ) : (
                <>
                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Questions Covered
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                        {filteredQuestionResponseAnalyticsSummary.questionsCovered}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Total Responses
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                        {filteredQuestionResponseAnalyticsSummary.totalResponses}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">
                        Correct
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-emerald-800 dark:text-emerald-100">
                        {filteredQuestionResponseAnalyticsSummary.correctResponses}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-rose-700 dark:text-rose-200">
                        Wrong
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-rose-800 dark:text-rose-100">
                        {filteredQuestionResponseAnalyticsSummary.incorrectResponses}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
                        Unanswered
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-amber-800 dark:text-amber-100">
                        {filteredQuestionResponseAnalyticsSummary.unansweredResponses}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {filteredQuestionResponseAnalytics.map((item) => {
                      const isExpanded = expandedQuestionAnalyticsId === item.questionId;

                      return (
                        <article
                          key={item.questionId}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
                        >
                          <button
                            type="button"
                            onClick={() => toggleQuestionAnalytics(item.questionId)}
                            className="w-full px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/70"
                          >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                              <div className="max-w-4xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
                                    {item.subjectName}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {item.totalResponses} response{item.totalResponses === 1 ? '' : 's'}
                                  </span>
                                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    Correct rate: {item.correctRate.toFixed(1)}%
                                  </span>
                                </div>
                                <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-900 dark:text-slate-100">
                                  {item.question}
                                </h3>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                  Correct {item.correctCount}
                                </span>
                                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                  Wrong {item.incorrectCount}
                                </span>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                                  No answer {item.unansweredCount}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                  {isExpanded ? 'Hide learner lists' : 'Show learner lists'}
                                </span>
                              </div>
                            </div>

                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={`Illustration for ${item.subjectName}`}
                                className="mt-4 max-h-56 rounded-2xl border border-slate-200 object-contain dark:border-slate-700"
                              />
                            ) : null}

                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                              {item.optionBreakdown.map((option) => (
                                <div
                                  key={option.option}
                                  className={`rounded-2xl border p-4 ${
                                    option.option === 'UNANSWERED'
                                      ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
                                      : option.isCorrectOption
                                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        {option.option === 'UNANSWERED' ? 'No Answer' : `Option ${option.option}`}
                                      </p>
                                      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        {option.count}
                                      </p>
                                    </div>
                                    {option.option === 'UNANSWERED' ? (
                                      <CircleDashed className="h-5 w-5 text-amber-600 dark:text-amber-200" />
                                    ) : option.isCorrectOption ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-200" />
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {option.label}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </button>

                          {isExpanded ? (
                            <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/60">
                              <div className="grid gap-4 xl:grid-cols-3">
                                <div className="rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-500/20 dark:bg-slate-950">
                                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                                    Correct Learners ({item.correctRespondents.length})
                                  </h4>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.correctRespondents.length > 0 ? (
                                      item.correctRespondents.map((respondent) => (
                                        <span
                                          key={respondent.resultId}
                                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                                        >
                                          {formatRespondentLabel(respondent)}
                                        </span>
                                      ))
                                    ) : (
                                      <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No learner picked the correct answer yet.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-rose-200 bg-white p-4 dark:border-rose-500/20 dark:bg-slate-950">
                                  <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                                    Wrong Learners ({item.incorrectRespondents.length})
                                  </h4>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.incorrectRespondents.length > 0 ? (
                                      item.incorrectRespondents.map((respondent) => (
                                        <span
                                          key={respondent.resultId}
                                          className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                                        >
                                          {formatRespondentLabel(respondent)}
                                        </span>
                                      ))
                                    ) : (
                                      <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No wrong selections recorded for this question.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-500/20 dark:bg-slate-950">
                                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-200">
                                    Unanswered ({item.unansweredRespondents.length})
                                  </h4>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {item.unansweredRespondents.length > 0 ? (
                                      item.unansweredRespondents.map((respondent) => (
                                        <span
                                          key={respondent.resultId}
                                          className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
                                        >
                                          {formatRespondentLabel(respondent)}
                                        </span>
                                      ))
                                    ) : (
                                      <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Every learner attempted this question.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-4 xl:grid-cols-5">
                                {item.optionBreakdown.map((option) => (
                                  <div
                                    key={option.option}
                                    className={`rounded-2xl border bg-white p-4 dark:bg-slate-950 ${
                                      option.option === 'UNANSWERED'
                                        ? 'border-amber-200 dark:border-amber-500/20'
                                        : option.isCorrectOption
                                          ? 'border-emerald-200 dark:border-emerald-500/20'
                                          : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {option.option === 'UNANSWERED'
                                          ? 'No Answer'
                                          : option.label}
                                      </h4>
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {option.count}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {option.respondents.length > 0 ? (
                                        option.respondents.map((respondent) => (
                                          <span
                                            key={`${option.option}-${respondent.resultId}`}
                                            className={`rounded-full px-3 py-1 text-xs ${
                                              option.option === 'UNANSWERED'
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'
                                                : option.isCorrectOption
                                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                          >
                                            {formatRespondentLabel(respondent)}
                                          </span>
                                        ))
                                      ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                          No learners in this group.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
