import { useMemo, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getQuestions, getUINs, getResults } from '../../../utils/storage';
import { getSections } from '../../../utils/testUtils';
import { FileQuestion, Ticket, Users, CheckCircle } from 'lucide-react';
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
import {
  downloadCsv,
  getAcademicYear,
  getResultPercentage,
  getResultStatus,
  getSectionBreakdownLabel,
} from '../../../utils/reporting';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState(getQuestions());
  const [uins, setUINs] = useState(getUINs());
  const [results, setResults] = useState(getResults());
  const [sections, setSections] = useState(getSections());

  useEffect(() => {
    const refresh = () => {
      setQuestions(getQuestions());
      setUINs(getUINs());
      setResults(getResults());
      setSections(getSections());
    };

    refresh();
    window.addEventListener('cbt-storage-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cbt-storage-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const resultsByYear = useMemo(() => {
    const map: Record<string, { total: number; pass: number; fail: number }> = {};
    results.forEach((result) => {
      const year = result.academicYear || getAcademicYear(result.completedAt);
      const percentage = getResultPercentage(result);
      if (!map[year]) {
        map[year] = { total: 0, pass: 0, fail: 0 };
      }
      map[year].total += 1;
      if (percentage >= 50) {
        map[year].pass += 1;
      } else {
        map[year].fail += 1;
      }
    });
    return map;
  }, [results]);

  const exportAnalyticsToCsv = () => {
    const headers = ['Academic Year', 'Total Tests', 'Passed', 'Failed', 'Pass Rate'];
    const rows = Object.entries(resultsByYear).map(([year, item]) => {
      const rate = item.total ? ((item.pass / item.total) * 100).toFixed(1) : '0.0';
      return [year, item.total.toString(), item.pass.toString(), item.fail.toString(), `${rate}%`];
    });

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
    const summaryTrend = Object.keys(resultsByYear).length > 1 ? 'Multi-year trend included.' : 'Single-year snapshot.';

    const rows = Object.entries(resultsByYear)
      .map(([year, item]) => {
        const rate = item.total ? ((item.pass / item.total) * 100).toFixed(1) : '0.0';
        return `<tr>
          <td>${year}</td>
          <td>${item.total}</td>
          <td>${item.pass}</td>
          <td>${item.fail}</td>
          <td>${rate}%</td>
        </tr>`;
      })
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

  const questionsBySection = sections.reduce((acc, section) => {
    acc[section] = questions.filter((q) => q.section === section).length;
    return acc;
  }, {} as Record<string, number>);
  const hasAnyQuestions = questions.length > 0 && Object.values(questionsBySection).some((count) => count > 0);
  const hasAnySections = sections.length > 0;

  const availableUINs = uins.filter((u) => !u.used).length;
  const usedUINs = uins.filter((u) => u.used).length;

  const totalTests = results.length;
  const totalPassed = results.filter(
    (r) => getResultPercentage(r) >= 50
  ).length;
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

  const chartData = useMemo(
    () =>
      Object.entries(resultsByYear).map(([year, data]) => {
        const passRate = data.total ? ((data.pass / data.total) * 100).toFixed(1) : '0.0';
        return {
          year,
          passed: data.pass,
          failed: data.fail,
          total: data.total,
          passRate: Number(passRate),
        };
      }),
    [resultsByYear]
  );

  const pieData = useMemo(() => {
    const totalPass = chartData.reduce((sum, row) => sum + row.passed, 0);
    const totalFail = chartData.reduce((sum, row) => sum + row.failed, 0);
    return [
      { name: 'Passed', value: totalPass },
      { name: 'Failed', value: totalFail },
    ].filter((item) => item.value > 0);
  }, [chartData]);

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
        <h1 className="text-2xl mb-6">Dashboard Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl mb-4">Questions by Section</h2>
            {hasAnyQuestions ? (
              <div className="space-y-3">
                {Object.entries(questionsBySection).map(([section, count]) => (
                  <div key={section} className="flex items-center justify-between">
                    <span className="text-gray-700">{section}</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">No courses/questions yet.</p>
                <p className="mt-1">Add courses and questions to populate this view.</p>
                <Link
                  to="/admin/questions"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Add Courses & Questions
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl">Recent Test Results</h2>
                <p className="text-xs text-slate-500">Exports live here</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportResultsCsv}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
              <p className="text-gray-500">No tests completed yet</p>
            ) : (
              <div className="space-y-3">
                {results.slice(-5).reverse().map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p>
                        {result.name} {result.surname}
                      </p>
                      <p className="text-sm text-gray-600">{result.uin}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg">
                        {result.totalScore}/{result.totalQuestions}
                      </p>
                      <p className="text-sm text-gray-600">
                        {((result.totalScore / result.totalQuestions) * 100).toFixed(
                          0
                        )}
                        %
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Performance Pulse</p>
              <h2 className="text-2xl font-semibold tracking-tight">Academic Year Analytics</h2>
              <p className="text-sm text-slate-500">{headlineMessage}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportAnalyticsToCsv}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

          {Object.keys(resultsByYear).length === 0 ? (
            <p className="mt-4 text-gray-500">No results data available to show analytics.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overall Pass Rate</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{overallPassRate.toFixed(1)}%</p>
                  <p className="text-sm text-slate-500">Across all academic years</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average Score</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-slate-500">Mean of all completed tests</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Tests</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{totalTests}</p>
                  <p className="text-sm text-slate-500">Learners assessed</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {Object.entries(resultsByYear).map(([year, data]) => {
                  const passRate = data.total ? ((data.pass / data.total) * 100).toFixed(1) : '0.0';
                  const barPass = data.total ? (data.pass / data.total) * 100 : 0;
                  const barFail = data.total ? (data.fail / data.total) * 100 : 0;

                  return (
                    <div key={year} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Academic Year</p>
                          <p className="text-lg font-semibold text-slate-900">{year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Pass Rate</p>
                          <p className="text-xl font-semibold">{passRate}%</p>
                        </div>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
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

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Pass: {data.pass}</span>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">Fail: {data.fail}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">Total: {data.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pieData.length > 0 && (
                <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Pass vs Fail (All Years)</p>
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
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-800 mb-2">Key Takeaway</p>
                    <p className="text-sm text-slate-600">
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
      </div>
    </AdminLayout>
  );
}
