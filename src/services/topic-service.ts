import type { Topic } from '../integrations/supabase/types';

export class TopicService {
  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    try {
      const res = await fetch(`/api/topics?subject_id=${encodeURIComponent(subjectId)}`);
      if (res.ok) return (await res.json()) as Topic[];
    } catch (err) {
      // ignore and fallback if needed
    }

    return [];
  }

  async getTopicById(id: string): Promise<Topic | null> {
    try {
      const res = await fetch(`/api/topics/${encodeURIComponent(id)}`);
      if (res.ok) return (await res.json()) as Topic;
    } catch (err) {
      // ignore
    }
    return null;
  }

  // Mutating operations should be performed via server-side admin endpoints.
  async createTopic(_: { subject_id: string; name: string; description: string; order_index?: number; }): Promise<Topic> {
    throw new Error('createTopic is disabled on the client. Use server-side admin endpoints to create topics.');
  }

  async updateTopic(_: string, __: { name?: string; description?: string; order_index?: number; is_active?: boolean; }): Promise<Topic> {
    throw new Error('updateTopic is disabled on the client. Use server-side admin endpoints to update topics.');
  }

  async deleteTopic(_: string): Promise<void> {
    throw new Error('deleteTopic is disabled on the client. Use server-side admin endpoints to delete topics.');
  }

  async getTopicCount(subjectId: string): Promise<number> {
    try {
      const res = await fetch(`/api/topics/count?subject_id=${encodeURIComponent(subjectId)}`);
      if (res.ok) {
        const data = await res.json();
        return typeof data.count === 'number' ? data.count : 0;
      }
    } catch (err) {
      // ignore
    }
    return 0;
  }
}

export const topicService = new TopicService();
