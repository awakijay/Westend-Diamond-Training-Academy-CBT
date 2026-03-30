import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getResults } from '../../../utils/storage';
import { format } from 'date-fns';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

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

  const averageScore =
    results.length > 0
      ? (
          results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
        ).toFixed(1)
      : 0;

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">Test Results</h1>
          <div className="text-sm text-gray-600">
            Total Tests: {results.length} | Average Score: {averageScore}/60
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
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm
                        ? 'No results found'
                        : 'No test results available'}
                    </td>
                  </tr>
                ) : (
                  sortedResults.map((result) => {
                    const percentage = (
                      (result.totalScore / result.totalQuestions) *
                      100
                    ).toFixed(1);
                    const isExpanded = expandedId === result.id;

                    return (
                      <>
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {result.name} {result.surname}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">
                            {result.uin}
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
                            <td colSpan={6} className="px-4 py-4 bg-gray-50">
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
                      </>
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
