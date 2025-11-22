import { useState, useEffect } from 'react';
import { adminAnalyticsService } from '../../services/admin-analytics-service';
import { Users, BookOpen, FileQuestion, TrendingUp } from 'lucide-react';

export function AnalyticsDashboard() {
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [quizAnalytics, setQuizAnalytics] = useState<any>(null);
  const [contentAnalytics, setContentAnalytics] = useState<any>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    const [user, quiz, content, subscription] = await Promise.all([
      adminAnalyticsService.getUserAnalytics(),
      adminAnalyticsService.getQuizAnalytics(),
      adminAnalyticsService.getContentAnalytics(),
      adminAnalyticsService.getSubscriptionAnalytics(),
    ]);
    setUserAnalytics(user);
    setQuizAnalytics(quiz);
    setContentAnalytics(content);
    setSubscriptionAnalytics(subscription);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* User Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          User Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Users</div>
            <div className="text-2xl font-bold">{userAnalytics?.totalUsers || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">New This Week</div>
            <div className="text-2xl font-bold text-green-600">{userAnalytics?.newUsersThisWeek || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">New This Month</div>
            <div className="text-2xl font-bold text-blue-600">{userAnalytics?.newUsersThisMonth || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active (7 days)</div>
            <div className="text-2xl font-bold text-purple-600">{userAnalytics?.activeUsers7Days || 0}</div>
          </div>
        </div>

        {/* Users by Subscription */}
        <div className="mt-4 bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-3">Users by Subscription Plan</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {userAnalytics?.usersBySubscription && Object.entries(userAnalytics.usersBySubscription).map(([plan, count]) => (
              <div key={plan} className="p-3 border rounded">
                <div className="text-sm text-gray-600">{plan}</div>
                <div className="text-xl font-bold">{count as number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Quiz Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Attempts</div>
            <div className="text-2xl font-bold">{quizAnalytics?.totalAttempts || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Average Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {quizAnalytics?.averageScore ? `${quizAnalytics.averageScore.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Most Popular</div>
            <div className="text-lg font-bold">
              {quizAnalytics?.mostPopularSubjects?.[0]?.subject || 'N/A'}
            </div>
          </div>
        </div>

        {/* Most Popular Subjects */}
        {quizAnalytics?.mostPopularSubjects && quizAnalytics.mostPopularSubjects.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <h4 className="font-medium mb-3">Top 5 Popular Subjects</h4>
            <div className="space-y-2">
              {quizAnalytics.mostPopularSubjects.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{item.subject}</span>
                  <span className="text-gray-600">{item.count} attempts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-purple-600" />
          Content Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Questions</div>
            <div className="text-2xl font-bold">{contentAnalytics?.totalQuestions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Subjects</div>
            <div className="text-2xl font-bold">{contentAnalytics?.totalSubjects || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Topics</div>
            <div className="text-2xl font-bold">{contentAnalytics?.totalTopics || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">JAMB Questions</div>
            <div className="text-2xl font-bold text-blue-600">{contentAnalytics?.questionsByExamType?.JAMB || 0}</div>
          </div>
        </div>

        {/* Questions by Difficulty */}
        <div className="mt-4 bg-white p-4 rounded-lg shadow">
          <h4 className="font-medium mb-3">Questions by Difficulty</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border rounded bg-green-50">
              <div className="text-sm text-gray-600">Easy</div>
              <div className="text-xl font-bold text-green-600">{contentAnalytics?.questionsByDifficulty?.EASY || 0}</div>
            </div>
            <div className="p-3 border rounded bg-yellow-50">
              <div className="text-sm text-gray-600">Medium</div>
              <div className="text-xl font-bold text-yellow-600">{contentAnalytics?.questionsByDifficulty?.MEDIUM || 0}</div>
            </div>
            <div className="p-3 border rounded bg-red-50">
              <div className="text-sm text-gray-600">Hard</div>
              <div className="text-xl font-bold text-red-600">{contentAnalytics?.questionsByDifficulty?.HARD || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-yellow-600" />
          Subscription Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Subscriptions</div>
            <div className="text-2xl font-bold">{subscriptionAnalytics?.activeSubscriptions || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              ₦{subscriptionAnalytics?.totalRevenue?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

