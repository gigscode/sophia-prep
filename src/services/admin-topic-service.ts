import { supabase } from '../integrations/supabase/client';
import type { Topic } from '../integrations/supabase/types';

export type TopicInput = {
  subject_id: string;
  name: string;
  description: string;
  order_index: number;
  is_active: boolean;
};

export class AdminTopicService {
  async getAllTopics(subjectId?: string): Promise<Topic[]> {
    try {
      let query = supabase.from('topics').select('*');

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      query = query.order('order_index', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching topics:', error);
        return [];
      }

      return (data as Topic[]) || [];
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      return [];
    }
  }

  async getTopicById(id: string): Promise<Topic | null> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching topic:', error);
        return null;
      }

      return (data as Topic) || null;
    } catch (err) {
      console.error('Failed to fetch topic:', err);
      return null;
    }
  }

  async createTopic(input: TopicInput): Promise<Topic | null> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([input as any])
        .select()
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        throw error; // Throw the error so it can be caught by the caller
      }

      return (data as Topic) || null;
    } catch (err) {
      console.error('Failed to create topic:', err);
      throw err; // Re-throw
    }
  }

  async updateTopic(id: string, updates: Partial<TopicInput>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('topics')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating topic:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to update topic:', err);
      return false;
    }
  }

  async deleteTopic(id: string): Promise<boolean> {
    try {
      // Check if topic has questions
      const { count } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('topic_id', id);

      if (count && count > 0) {
        throw new Error('Cannot delete topic with existing questions');
      }

      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting topic:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete topic:', err);
      return false;
    }
  }

  async reorderTopics(topicIds: string[]): Promise<boolean> {
    try {
      // Update order_index for each topic
      const updates = topicIds.map((id, index) =>
        supabase.from('topics').update({ order_index: index }).eq('id', id)
      );

      await Promise.all(updates);
      return true;
    } catch (err) {
      console.error('Failed to reorder topics:', err);
      return false;
    }
  }

  async getTopicsGroupedBySubject(): Promise<Record<string, Topic[]>> {
    try {
      const topics = await this.getAllTopics();
      const grouped: Record<string, Topic[]> = {};

      topics.forEach(topic => {
        if (!grouped[topic.subject_id]) {
          grouped[topic.subject_id] = [];
        }
        grouped[topic.subject_id].push(topic);
      });

      return grouped;
    } catch (err) {
      console.error('Failed to group topics:', err);
      return {};
    }
  }
}

export const adminTopicService = new AdminTopicService();

