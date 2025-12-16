import { supabase } from '../integrations/supabase/client';

export type UserAnalytics = {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  usersBySubscription: Record<string, number>;
};

export type QuizAnalytics = {
  totalAttempts: number;
  averageScore: number;
  attemptsBySubject: Record<string, number>;
  averageScoreBySubject: Record<string, number>;
  mostPopularSubjects: { subject: string; count: number }[];

};

export type ContentAnalytics = {
  totalQuestions: number;
  totalSubjects: number;
  totalTopics: number;
  questionsBySubject: Record<string, number>;
  questionsByExamType: Record<string, number>;
};

export type SubscriptionAnalytics = {
  activeSubscriptions: number;
  subscriptionsByPlan: Record<string, number>;
  totalRevenue: number;
  churnRate: number;
};

export class AdminAnalyticsService {
  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // New users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: newUsersThisWeek } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // New users this month
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const { count: newUsersThisMonth } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Active users (last 7 days)
      const { count: activeUsers7Days } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', weekAgo.toISOString());

      // Active users (last 30 days)
      const { count: activeUsers30Days } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', monthAgo.toISOString());

      // Users by subscription
      const { data: users } = await supabase
        .from('user_profiles')
        .select('subscription_plan');

      const usersBySubscription: Record<string, number> = {};
      users?.forEach((user: { subscription_plan?: string }) => {
        const plan = user.subscription_plan || 'Free';
        usersBySubscription[plan] = (usersBySubscription[plan] || 0) + 1;
      });

      return {
        totalUsers: totalUsers || 0,
        newUsersThisWeek: newUsersThisWeek || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeUsers7Days: activeUsers7Days || 0,
        activeUsers30Days: activeUsers30Days || 0,
        usersBySubscription,
      };
    } catch (err) {
      console.error('Failed to get user analytics:', err);
      return {
        totalUsers: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        activeUsers7Days: 0,
        activeUsers30Days: 0,
        usersBySubscription: {},
      };
    }
  }

  async getQuizAnalytics(): Promise<QuizAnalytics> {
    try {
      // Total attempts
      const { count: totalAttempts } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true });

      // Get all attempts for calculations
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('score_percentage, subject_id');

      let totalScore = 0;
      const attemptsBySubject: Record<string, number> = {};
      const scoresBySubject: Record<string, number[]> = {};

      attempts?.forEach((attempt: { score_percentage?: number; subject_id?: string }) => {
        totalScore += attempt.score_percentage || 0;
        const subject = attempt.subject_id || 'Unknown';
        attemptsBySubject[subject] = (attemptsBySubject[subject] || 0) + 1;
        if (!scoresBySubject[subject]) scoresBySubject[subject] = [];
        scoresBySubject[subject].push(attempt.score_percentage || 0);
      });

      const averageScore = attempts && attempts.length > 0 ? totalScore / attempts.length : 0;

      const averageScoreBySubject: Record<string, number> = {};
      Object.keys(scoresBySubject).forEach(subject => {
        const scores = scoresBySubject[subject];
        averageScoreBySubject[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
      });

      const mostPopularSubjects = Object.entries(attemptsBySubject)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalAttempts: totalAttempts || 0,
        averageScore,
        attemptsBySubject,
        averageScoreBySubject,
        mostPopularSubjects,

      };
    } catch (err) {
      console.error('Failed to get quiz analytics:', err);
      return {
        totalAttempts: 0,
        averageScore: 0,
        attemptsBySubject: {},
        averageScoreBySubject: {},
        mostPopularSubjects: [],

      };
    }
  }

  async getContentAnalytics(): Promise<ContentAnalytics> {
    try {
      // Total counts
      const { count: totalQuestions } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { count: totalSubjects } = await supabase
        .from('subjects')
        .select('*', { count: 'exact', head: true });



      // Get questions by exam type (with error handling)
      const questionsByExamType: Record<string, number> = { JAMB: 0 };
      
      try {
        const { data: questions, error } = await supabase
          .from('questions')
          .select('exam_type');

        if (error) {
          if (error.code === '42703' || error.message?.includes('does not exist')) {
            console.warn('Questions table schema issue - exam_type column may not exist');
          } else {
            console.error('Error fetching questions for analytics:', error);
          }
        } else {
          questions?.forEach((q: { exam_type?: string }) => {
            if (q.exam_type) questionsByExamType[q.exam_type]++;
          });
        }
      } catch (error) {
        console.warn('Failed to fetch questions analytics, using defaults:', error);
      }

      return {
        totalQuestions: totalQuestions || 0,
        totalSubjects: totalSubjects || 0,
        totalTopics: 0, // Topics feature removed
        questionsBySubject: {}, // Would need join with subjects
        questionsByExamType,
      };
    } catch (err) {
      console.error('Failed to get content analytics:', err);
      return {
        totalQuestions: 0,
        totalSubjects: 0,
        totalTopics: 0,
        questionsBySubject: {},
        questionsByExamType: {},
      };
    }
  }

  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    try {
      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Subscriptions by plan
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status');

      const subscriptionsByPlan: Record<string, number> = {};
      subscriptions?.forEach((sub: { status?: string; plan_id?: string }) => {
        if (sub.status === 'active') {
          subscriptionsByPlan[sub.plan_id || 'unknown'] = (subscriptionsByPlan[sub.plan_id || 'unknown'] || 0) + 1;
        }
      });

      return {
        activeSubscriptions: activeSubscriptions || 0,
        subscriptionsByPlan,
        totalRevenue: 0, // Would need payment data
        churnRate: 0, // Would need historical data
      };
    } catch (err) {
      console.error('Failed to get subscription analytics:', err);
      return {
        activeSubscriptions: 0,
        subscriptionsByPlan: {},
        totalRevenue: 0,
        churnRate: 0,
      };
    }
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();

