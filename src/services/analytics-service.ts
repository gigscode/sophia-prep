import { supabase } from '../integrations/supabase/client';

export interface QuizAttempt {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic_id: string | null;
  quiz_mode: 'PRACTICE' | 'MOCK_EXAM' | 'READER' | 'PAST_QUESTIONS';
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
  time_taken_seconds: number;
  exam_year: number | null;
  questions_data: any[];
  completed_at: string;
  created_at: string;
}

export interface UserAnalytics {
  total_attempts: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  total_questions_attempted: number;
  total_correct_answers: number;
  average_time_seconds: number;
  pass_rate: number; // Percentage of quizzes with score >= 50%
}

export interface SubjectPerformance {
  subject_name: string;
  subject_slug: string;
  attempts: number;
  average_score: number;
  best_score: number;
  total_questions: number;
  correct_answers: number;
  pass_rate: number;
}

export interface QuizModeStats {
  quiz_mode: string;
  attempts: number;
  average_score: number;
  total_questions: number;
  correct_answers: number;
}

export interface PerformanceTrend {
  date: string;
  average_score: number;
  attempts: number;
}

class AnalyticsService {
  /**
   * Save a quiz attempt to the database
   */
  async saveQuizAttempt(data: {
    subject_id?: string;
    topic_id?: string;
    quiz_mode: 'practice' | 'cbt' | 'mock' | 'reader';
    total_questions: number;
    correct_answers: number;
    time_taken_seconds: number;
    exam_year?: number;
    questions_data?: any[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const incorrect_answers = data.total_questions - data.correct_answers;
      const score_percentage = (data.correct_answers / data.total_questions) * 100;

      // Map quiz mode to database enum
      const modeMap: Record<string, string> = {
        'practice': 'PRACTICE',
        'cbt': 'PAST_QUESTIONS',
        'mock': 'MOCK_EXAM',
        'reader': 'READER'
      };

      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          subject_id: data.subject_id || null,
          topic_id: data.topic_id || null,
          quiz_mode: modeMap[data.quiz_mode] || 'PRACTICE',
          total_questions: data.total_questions,
          correct_answers: data.correct_answers,
          incorrect_answers,
          score_percentage,
          time_taken_seconds: data.time_taken_seconds,
          exam_year: data.exam_year || null,
          questions_data: data.questions_data || []
        } as any);

      if (error) {
        console.error('Error saving quiz attempt:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in saveQuizAttempt:', error);
      return { success: false, error: 'Failed to save quiz attempt' };
    }
  }

  /**
   * Get overall user analytics
   */
  async getUserAnalytics(userId?: string): Promise<UserAnalytics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) {
        console.error('Error fetching user analytics:', error);
        return null;
      }

      const attempts = (data || []) as any[];

      if (!attempts || attempts.length === 0) {
        return {
          total_attempts: 0,
          average_score: 0,
          best_score: 0,
          worst_score: 0,
          total_questions_attempted: 0,
          total_correct_answers: 0,
          average_time_seconds: 0,
          pass_rate: 0
        };
      }

      const total_attempts = attempts.length;
      const scores = attempts.map(a => a.score_percentage);
      const average_score = scores.reduce((a, b) => a + b, 0) / total_attempts;
      const best_score = Math.max(...scores);
      const worst_score = Math.min(...scores);
      const total_questions_attempted = attempts.reduce((sum, a) => sum + a.total_questions, 0);
      const total_correct_answers = attempts.reduce((sum, a) => sum + a.correct_answers, 0);
      const average_time_seconds = attempts.reduce((sum, a) => sum + a.time_taken_seconds, 0) / total_attempts;
      const passed_attempts = attempts.filter(a => a.score_percentage >= 50).length;
      const pass_rate = (passed_attempts / total_attempts) * 100;

      return {
        total_attempts,
        average_score: Math.round(average_score * 100) / 100,
        best_score: Math.round(best_score * 100) / 100,
        worst_score: Math.round(worst_score * 100) / 100,
        total_questions_attempted,
        total_correct_answers,
        average_time_seconds: Math.round(average_time_seconds),
        pass_rate: Math.round(pass_rate * 100) / 100
      };
    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      return null;
    }
  }

  /**
   * Get subject-wise performance
   */
  async getSubjectPerformance(userId?: string): Promise<SubjectPerformance[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          subjects (
            name,
            slug
          )
        `)
        .eq('user_id', targetUserId)
        .not('subject_id', 'is', null);

      if (error) {
        console.error('Error fetching subject performance:', error);
        return [];
      }

      const attempts = (data || []) as any[];

      if (!attempts || attempts.length === 0) return [];

      // Group by subject
      const subjectMap = new Map<string, any[]>();
      attempts.forEach(attempt => {
        const subject = attempt.subjects as any;
        if (subject) {
          const key = subject.slug;
          if (!subjectMap.has(key)) {
            subjectMap.set(key, []);
          }
          subjectMap.get(key)!.push(attempt);
        }
      });

      // Calculate stats for each subject
      const performance: SubjectPerformance[] = [];
      subjectMap.forEach((attempts, slug) => {
        const subject = (attempts[0].subjects as any);
        const total_attempts = attempts.length;
        const scores = attempts.map(a => a.score_percentage);
        const average_score = scores.reduce((a, b) => a + b, 0) / total_attempts;
        const best_score = Math.max(...scores);
        const total_questions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
        const correct_answers = attempts.reduce((sum, a) => sum + a.correct_answers, 0);
        const passed = attempts.filter(a => a.score_percentage >= 50).length;
        const pass_rate = (passed / total_attempts) * 100;

        performance.push({
          subject_name: subject.name,
          subject_slug: slug,
          attempts: total_attempts,
          average_score: Math.round(average_score * 100) / 100,
          best_score: Math.round(best_score * 100) / 100,
          total_questions,
          correct_answers,
          pass_rate: Math.round(pass_rate * 100) / 100
        });
      });

      return performance.sort((a, b) => b.attempts - a.attempts);
    } catch (error) {
      console.error('Error in getSubjectPerformance:', error);
      return [];
    }
  }

  /**
   * Get quiz mode statistics
   */
  async getQuizModeStats(userId?: string): Promise<QuizModeStats[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', targetUserId);

      const attempts = (data || []) as any[];

      if (error || !attempts || attempts.length === 0) return [];

      // Group by quiz mode
      const modeMap = new Map<string, any[]>();
      attempts.forEach(attempt => {
        const mode = attempt.quiz_mode;
        if (!modeMap.has(mode)) {
          modeMap.set(mode, []);
        }
        modeMap.get(mode)!.push(attempt);
      });

      const stats: QuizModeStats[] = [];
      modeMap.forEach((attempts, mode) => {
        const total_attempts = attempts.length;
        const scores = attempts.map(a => a.score_percentage);
        const average_score = scores.reduce((a, b) => a + b, 0) / total_attempts;
        const total_questions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
        const correct_answers = attempts.reduce((sum, a) => sum + a.correct_answers, 0);

        stats.push({
          quiz_mode: mode,
          attempts: total_attempts,
          average_score: Math.round(average_score * 100) / 100,
          total_questions,
          correct_answers
        });
      });

      return stats;
    } catch (error) {
      console.error('Error in getQuizModeStats:', error);
      return [];
    }
  }

  /**
   * Get performance trend over time (last 30 days)
   */
  async getPerformanceTrend(userId?: string, days: number = 30): Promise<PerformanceTrend[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      const attempts = (data || []) as any[];

      if (error || !attempts || attempts.length === 0) return [];

      // Group by date
      const dateMap = new Map<string, any[]>();
      attempts.forEach(attempt => {
        const date = new Date(attempt.completed_at).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, []);
        }
        dateMap.get(date)!.push(attempt);
      });

      const trend: PerformanceTrend[] = [];
      dateMap.forEach((attempts, date) => {
        const scores = attempts.map(a => a.score_percentage);
        const average_score = scores.reduce((a, b) => a + b, 0) / attempts.length;

        trend.push({
          date,
          average_score: Math.round(average_score * 100) / 100,
          attempts: attempts.length
        });
      });

      return trend;
    } catch (error) {
      console.error('Error in getPerformanceTrend:', error);
      return [];
    }
  }

  /**
   * Get recent quiz attempts
   */
  async getRecentAttempts(userId?: string, limit: number = 10): Promise<QuizAttempt[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', targetUserId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent attempts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentAttempts:', error);
      return [];
    }
  }
}

export const analyticsService = new AnalyticsService();
