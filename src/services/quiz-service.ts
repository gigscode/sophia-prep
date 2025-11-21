import { questionService, normalizeQuestions } from './question-service';
import { supabase } from '../integrations/supabase/client';

export interface QuizQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correct: string;
  explanation?: string;
}

// Removed normalizeEntry - now using normalizeQuestions from question-service

export const quizService = {
  /**
   * Get questions for a specific subject from Supabase
   * @param subjectSlug - Subject slug (e.g., 'mathematics', 'english-language')
   * @param limit - Maximum number of questions to return (default: 200)
   */
  async getQuestionsForSubject(subjectSlug: string, limit = 200): Promise<QuizQuestion[]> {
    try {
      // Fetch questions from Supabase using questionService
      const questions = await questionService.getQuestionsBySubjectSlug(subjectSlug, { limit });

      // Normalize to QuizQuestion format
      return normalizeQuestions(questions);
    } catch (err) {
      console.error('quizService: Failed to fetch questions from Supabase', err);
      return [];
    }
  },

  /**
   * Get random questions from all subjects
   * @param count - Number of random questions to return (default: 10)
   */
  async getRandomQuestions(count = 10): Promise<QuizQuestion[]> {
    try {
      // Fetch random questions from all active subjects
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .limit(count * 3); // Fetch more to ensure we have enough after filtering

      if (error) {
        console.error('quizService: Error fetching random questions', error);
        return [];
      }

      if (!questions || questions.length === 0) {
        return [];
      }

      // Shuffle the questions
      const shuffled = [...questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Normalize and return the requested count
      return normalizeQuestions(shuffled.slice(0, count));
    } catch (err) {
      console.error('quizService: Failed to fetch random questions', err);
      return [];
    }
  }
};
