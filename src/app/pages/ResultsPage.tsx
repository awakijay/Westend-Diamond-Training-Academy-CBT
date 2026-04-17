import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, GraduationCap, Home } from 'lucide-react';
import type { TestResult } from '../../types';
import { getLatestResult } from '../../utils/clientState';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                isPassing ? 'bg-green-100' : 'bg-blue-100'
              }`}
            >
              {isPassing ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <GraduationCap className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <h1 className="text-3xl mb-2">Test Completed!</h1>
            <p className="text-gray-600">
              {result.name} {result.surname}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Overall Score</p>
              <p className="text-5xl mb-2">
                {result.totalScore}/{result.totalQuestions}
              </p>
              <p className="text-2xl text-indigo-600">{percentage}%</p>
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
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="mb-2">{section.section}</p>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full transition-all"
                        style={{ width: `${sectionPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-xl">
                      {section.score}/{section.total}
                    </p>
                    <p className="text-sm text-gray-600">{sectionPercentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
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
