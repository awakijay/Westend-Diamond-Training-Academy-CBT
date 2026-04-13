import { Fragment, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getResults } from '../../../utils/storage';
import { format } from 'date-fns';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import logo from '../../../assets/wednl-banner1-3.png';
import {
  downloadCsv,
  getAcademicYear,
  getResultPercentage,
  getResultStatus,
  getSectionBreakdownLabel,
} from '../../../utils/reporting';

export default function AdminResults() {
  const [results, setResults] = useState(getResults());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredResults = results.filter((result) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      result.name.toLowerCase().includes(searchLower) ||
      result.surname.toLowerCase().includes(searchLower) ||
      result.uin.toLowerCase().includes(searchLower)
    );
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison =
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        break;
      case 'score':
        comparison = a.totalScore - b.totalScore;
        break;
      case 'name':
        comparison = `${a.name} ${a.surname}`.localeCompare(
          `${b.name} ${b.surname}`
        );
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'date' | 'score' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
            <div className="text-sm text-gray-600">
              Total Tests: {results.length} | Average Score: {averagePercentage}%
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportResultsCsv}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, surname, or UIN..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-slate-700"
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
                      className="flex items-center gap-1 hover:text-slate-700"
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
                      className="flex items-center gap-1 hover:text-slate-700"
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
              <tbody className="divide-y divide-gray-200">
                {sortedResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm
                        ? 'No results found'
                        : 'No test results available'}
                    </td>
                  </tr>
                ) : (
                  sortedResults.map((result) => {
                    const percentage = getResultPercentage(result).toFixed(1);
                    const isExpanded = expandedId === result.id;

                    return (
                      <Fragment key={result.id}>
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {result.name} {result.surname}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">
                            {result.uin}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {result.academicYear || getAcademicYear(result.completedAt)}
                          </td>
                          <td className="px-4 py-3">
                            {result.totalScore}/{result.totalQuestions}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-sm ${
                                parseFloat(percentage) >= 50
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">
                            {getResultStatus(result)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {format(
                              new Date(result.completedAt),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleExpand(result.id)}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              {isExpanded ? 'Hide' : 'Show'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-gray-50">
                              <div className="space-y-2">
                                <h4 className="text-sm mb-3">
                                  Section Breakdown:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {result.sectionResults.map(
                                    (section, index) => {
                                      const sectionPercentage = (
                                        (section.score / section.total) *
                                        100
                                      ).toFixed(0);

                                      return (
                                        <div
                                          key={index}
                                          className="bg-white rounded-lg p-3 border border-gray-200"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm">
                                              {section.section}
                                            </span>
                                            <span className="text-sm">
                                              {section.score}/{section.total}
                                            </span>
                                          </div>
                                          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                              className="bg-indigo-600 h-full"
                                              style={{
                                                width: `${sectionPercentage}%`,
                                              }}
                                            />
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1 text-right">
                                            {sectionPercentage}%
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
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
