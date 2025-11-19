import { supabase } from '../integrations/supabase/client';
import type { Topic } from '../integrations/supabase/types';

export class TopicService {
  /**
   * Get all topics for a subject
   */
  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single topic by ID
   */
  async getTopicById(id: string): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch topic: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new topic
   */
  async createTopic(topic: {
    subject_id: string;
    name: string;
    description: string;
    order_index?: number;
  }): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics')
      .insert({
        subject_id: topic.subject_id,
        name: topic.name,
        description: topic.description,
        order_index: topic.order_index || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create topic: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a topic
   */
  async updateTopic(
    id: string,
    updates: {
      name?: string;
      description?: string;
      order_index?: number;
      is_active?: boolean;
    }
  ): Promise<Topic> {
    const { data, error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update topic: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a topic (soft delete by setting is_active to false)
   */
  async deleteTopic(id: string): Promise<void> {
    const { error } = await supabase
      .from('topics')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete topic: ${error.message}`);
    }
  }

  /**
   * Get topic count for a subject
   */
  async getTopicCount(subjectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to count topics: ${error.message}`);
    }

    return count || 0;
  }
}

export const topicService = new TopicService();
