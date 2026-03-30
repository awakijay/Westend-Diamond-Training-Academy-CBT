import AdminLayout from '../../components/AdminLayout';
import { getQuestions, getUINs, getResults } from '../../../utils/storage';
import { FileQuestion, Ticket, Users, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const questions = getQuestions();
  const uins = getUINs();
  const results = getResults();

  const questionsBySection = {
    Mathematics: questions.filter((q) => q.section === 'Mathematics').length,
    English: questions.filter((q) => q.section === 'English').length,
    Science: questions.filter((q) => q.section === 'Science').length,
    'Social Studies': questions.filter((q) => q.section === 'Social Studies')
      .length,
    'General Knowledge': questions.filter(
      (q) => q.section === 'General Knowledge'
    ).length,
  };

  const availableUINs = uins.filter((u) => !u.used).length;
  const usedUINs = uins.filter((u) => u.used).length;

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
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl mb-4">Recent Test Results</h2>
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
      </div>
    </AdminLayout>
  );
}
