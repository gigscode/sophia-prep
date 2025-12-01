import { useEffect, useState } from 'react';
import { TrendingUp, Target, Clock, Award, BookOpen, BarChart3 } from 'lucide-react';
import { analyticsService, UserAnalytics, SubjectPerformance, QuizModeStats } from '../../services/analytics-service';
import { Card } from '../ui/Card';

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [quizModeStats, setQuizModeStats] = useState<QuizModeStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, subjectData, modeData] = await Promise.all([
        analyticsService.getUserAnalytics(),
        analyticsService.getSubjectPerformance(),
        analyticsService.getQuizModeStats()
      ]);

      setAnalytics(analyticsData);
      setSubjectPerformance(subjectData);
      setQuizModeStats(modeData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <div className="text-center py-8">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No quiz data available yet.</p>
          <p className="text-sm text-gray-500 mt-2">Start taking quizzes to see your analytics!</p>
        </div>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold">{analytics.total_attempts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.average_score)}`}>
                {analytics.average_score}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Best Score</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.best_score}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className={`text-2xl font-bold ${getScoreColor(analytics.pass_rate)}`}>
                {analytics.pass_rate}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Questions Attempted</p>
              <p className="text-xl font-bold">{analytics.total_questions_attempted}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Correct Answers</p>
              <p className="text-xl font-bold text-green-600">{analytics.total_correct_answers}</p>
            </div>
            <Target className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Time per Quiz</p>
              <p className="text-xl font-bold">{Math.floor(analytics.average_time_seconds / 60)}m</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Subject Performance */}
      {subjectPerformance.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject Performance
          </h3>
          <div className="space-y-3">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject_slug} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{subject.subject_name}</h4>
                  <span className="text-sm text-gray-600">{subject.attempts} attempts</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Avg Score</p>
                    <p className={`font-bold ${getScoreColor(subject.average_score)}`}>
                      {subject.average_score}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Best Score</p>
                    <p className="font-bold text-purple-600">{subject.best_score}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pass Rate</p>
                    <p className={`font-bold ${getScoreColor(subject.pass_rate)}`}>
                      {subject.pass_rate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Accuracy</p>
                    <p className="font-bold">
                      {Math.round((subject.correct_answers / subject.total_questions) * 100)}%
                    </p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        subject.average_score >= 75
                          ? 'bg-green-500'
                          : subject.average_score >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${subject.average_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quiz Mode Stats */}
      {quizModeStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Quiz Mode Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizModeStats.map((mode) => (
              <div key={mode.quiz_mode} className={`border-2 rounded-lg p-4 ${getScoreBgColor(mode.average_score)}`}>
                <h4 className="font-semibold mb-2 capitalize">
                  {mode.quiz_mode.replace('_', ' ').toLowerCase()}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Attempts</p>
                    <p className="font-bold">{mode.attempts}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Score</p>
                    <p className={`font-bold ${getScoreColor(mode.average_score)}`}>
                      {mode.average_score}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Questions</p>
                    <p className="font-bold">{mode.total_questions}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Correct</p>
                    <p className="font-bold text-green-600">{mode.correct_answers}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
