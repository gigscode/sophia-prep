import { supabase } from '../integrations/supabase/client';

export interface TopicCategory {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  description?: string;
  color_theme: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description?: string;
  parent_topic_id?: string;
  topic_level: number;
  sort_order: number;
  is_active: boolean;
  estimated_questions_count: number;

  estimated_study_time_minutes: number;
  prerequisites?: string[];
  created_at: string;
  updated_at: string;
  
  // Relations
  category?: TopicCategory;
  parent_topic?: Topic;
  subtopics?: Topic[];
  questions_count?: number;
}

export interface TopicWithStats extends Topic {
  questions_count: number;
  subtopics_count: number;
  user_progress?: {
    completed_questions: number;
    total_questions: number;
    average_score: number;
  };
}

class TopicsService {
  /**
   * Get all topic categories for a subject
   */
  async getTopicCategories(subjectSlug: string): Promise<TopicCategory[]> {
    try {
      const { data, error } = await supabase
        .from('topic_categories')
        .select(`
          *,
          subjects!inner(slug)
        `)
        .eq('subjects.slug', subjectSlug)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching topic categories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopicCategories:', error);
      return [];
    }
  }

  /**
   * Get topics for a subject, optionally filtered by category
   */
  async getTopics(
    subjectSlug: string, 
    categorySlug?: string,
    includeStats = false
  ): Promise<Topic[]> {
    try {
      let query = supabase
        .from('topics')
        .select(`
          *,
          topic_categories(id, name, slug, color_theme),
          subjects!inner(slug)
          ${includeStats ? ',questions(count)' : ''}
        `)
        .eq('subjects.slug', subjectSlug)
        .eq('is_active', true);

      if (categorySlug) {
        query = query.eq('topic_categories.slug', categorySlug);
      }

      const { data, error } = await query.order('sort_order');

      if (error) {
        console.error('Error fetching topics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopics:', error);
      return [];
    }
  }

  /**
   * Get topics organized by category
   */
  async getTopicsByCategory(subjectSlug: string): Promise<Record<string, Topic[]>> {
    try {
      const topics = await this.getTopics(subjectSlug);
      const topicsByCategory: Record<string, Topic[]> = {};

      topics.forEach(topic => {
        const categorySlug = topic.category?.slug || 'uncategorized';
        if (!topicsByCategory[categorySlug]) {
          topicsByCategory[categorySlug] = [];
        }
        topicsByCategory[categorySlug].push(topic);
      });

      return topicsByCategory;
    } catch (error) {
      console.error('Error in getTopicsByCategory:', error);
      return {};
    }
  }

  /**
   * Get a single topic with detailed information
   */
  async getTopic(subjectSlug: string, topicSlug: string): Promise<Topic | null> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_categories(id, name, slug, color_theme),
          subjects!inner(slug),
          parent_topic:topics!parent_topic_id(id, name, slug),
          subtopics:topics!parent_topic_id(id, name, slug, sort_order)
        `)
        .eq('subjects.slug', subjectSlug)
        .eq('slug', topicSlug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching topic:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTopic:', error);
      return null;
    }
  }

  /**
   * Get topic statistics (questions count, user progress, etc.)
   */
  async getTopicStats(topicId: string, userId?: string): Promise<{
    questions_count: number;
    subtopics_count: number;
    user_progress?: {
      completed_questions: number;
      total_questions: number;
      average_score: number;
    };
  }> {
    try {
      // Get questions count
      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId)
        .eq('is_active', true);

      // Get subtopics count
      const { count: subtopicsCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('parent_topic_id', topicId)
        .eq('is_active', true);

      const stats = {
        questions_count: questionsCount || 0,
        subtopics_count: subtopicsCount || 0
      };

      // Get user progress if userId provided
      if (userId) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('total_questions, correct_answers, score_percentage')
          .eq('user_id', userId)
          .eq('topic_id', topicId);

        if (attempts && attempts.length > 0) {
          const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
          const correctAnswers = attempts.reduce((sum, a) => sum + a.correct_answers, 0);
          const averageScore = attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length;

          stats.user_progress = {
            completed_questions: totalQuestions,
            total_questions: questionsCount || 0,
            average_score: Math.round(averageScore * 100) / 100
          };
        }
      }

      return stats;
    } catch (error) {
      console.error('Error in getTopicStats:', error);
      return {
        questions_count: 0,
        subtopics_count: 0
      };
    }
  }

  /**
   * Search topics by name or description
   */
  async searchTopics(
    subjectSlug: string, 
    searchTerm: string, 
    limit = 10
  ): Promise<Topic[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_categories(id, name, slug, color_theme),
          subjects!inner(slug)
        `)
        .eq('subjects.slug', subjectSlug)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching topics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchTopics:', error);
      return [];
    }
  }

  /**
   * Get recommended topics based on user progress
   */
  async getRecommendedTopics(
    subjectSlug: string, 
    userId: string, 
    limit = 5
  ): Promise<Topic[]> {
    try {
      // This is a simplified recommendation algorithm
      // You can enhance it based on user performance, prerequisites, etc.
      
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          topic_categories(id, name, slug, color_theme),
          subjects!inner(slug)
        `)
        .eq('subjects.slug', subjectSlug)
        .eq('is_active', true)
        .limit(limit);

      if (error) {
        console.error('Error getting recommended topics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecommendedTopics:', error);
      return [];
    }
  }

  /**
   * Get topic hierarchy (breadcrumb path)
   */
  async getTopicHierarchy(topicId: string): Promise<Topic[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_topic_hierarchy', { topic_uuid: topicId });

      if (error) {
        console.error('Error getting topic hierarchy:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopicHierarchy:', error);
      return [];
    }
  }
}

export const topicsService = new TopicsService();