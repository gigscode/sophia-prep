import { supabase } from '../integrations/supabase/client';
import type { Topic } from '../integrations/supabase/types';

export type TopicInput = {
  subject_id: string;
  name: string;
  description?: string;
  order_index?: number;
  is_active?: boolean;
};

export class AdminTopicService {
  /**
   * Get all topics, optionally filtered by subject
   */
  async getAllTopics(subjectId?: string): Promise<Topic[]> {
    try {
      let query = supabase
        .from('topics')
        .select('*, subjects(name, slug)')
        .order('order_index');

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching topics:', error);
        return [];
      }

      return (data as any[]) || [];
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      return [];
    }
  }

  /**
   * Get topics grouped by subject
   */
  async getTopicsGroupedBySubject(): Promise<Record<string, Topic[]>> {
    try {
      const topics = await this.getAllTopics();
      const grouped: Record<string, Topic[]> = {};

      topics.forEach(topic => {
        const subjectId = topic.subject_id;
        if (!grouped[subjectId]) {
          grouped[subjectId] = [];
        }
        grouped[subjectId].push(topic);
      });

      return grouped;
    } catch (err) {
      console.error('Failed to group topics by subject:', err);
      return {};
    }
  }

  /**
   * Create a new topic
   */
  async createTopic(input: TopicInput): Promise<Topic | null> {
    try {
      const { data, error } = await (supabase
        .from('topics') as any)
        .insert([input])
        .select('*, subjects(name, slug)')
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        return null;
      }

      return (data as Topic) || null;
    } catch (err) {
      console.error('Failed to create topic:', err);
      return null;
    }
  }

  /**
   * Update an existing topic
   */
  async updateTopic(id: string, updates: Partial<TopicInput>): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('topics') as any)
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

  /**
   * Delete a topic
   */
  async deleteTopic(id: string): Promise<boolean> {
    try {
      // First check if there are any questions linked to this topic
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', id);

      if (count && count > 0) {
        throw new Error(`Cannot delete topic: ${count} question(s) are linked to this topic`);
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
      throw err;
    }
  }

  /**
   * Toggle topic active status
   */
  async toggleTopicStatus(id: string, isActive: boolean): Promise<boolean> {
    return this.updateTopic(id, { is_active: isActive });
  }

  /**
   * Reorder topics (for drag-and-drop functionality)
   */
  async reorderTopics(topicIds: string[]): Promise<boolean> {
    try {
      const updates = topicIds.map((id, index) => ({
        id,
        order_index: index
      }));

      for (const update of updates) {
        await this.updateTopic(update.id, { order_index: update.order_index });
      }

      return true;
    } catch (err) {
      console.error('Failed to reorder topics:', err);
      return false;
    }
  }
}

export const adminTopicService = new AdminTopicService();

