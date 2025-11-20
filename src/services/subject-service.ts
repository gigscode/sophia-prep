import type { Subject, ExamType, SubjectCategory } from '../integrations/supabase/types';

export class SubjectService {
  /**
   * Get all subjects via server proxy, fallback to local JSON
   */
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data as Subject[];
      }
    } catch (err) {
      // ignore and fallback to local
    }

    try {
      const res = await fetch('/data/subjects.json');
      if (res.ok) return (await res.json()) as Subject[];
    } catch (e) {
      // ignore
    }

    return [];
  }

  async getSubjectsByExamType(examType: ExamType): Promise<Subject[]> {
    try {
      const res = await fetch(`/api/subjects?exam_type=${encodeURIComponent(String(examType))}`);
      if (res.ok) return (await res.json()) as Subject[];
    } catch (err) {
      // ignore
    }

    return [];
  }

  async getSubjectsByCategory(category: SubjectCategory): Promise<Subject[]> {
    try {
      const res = await fetch(`/api/subjects?category=${encodeURIComponent(String(category))}`);
      if (res.ok) return (await res.json()) as Subject[];
    } catch (err) {
      // ignore
    }
    return [];
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const res = await fetch(`/api/subjects/${encodeURIComponent(id)}`);
      if (res.ok) return (await res.json()) as Subject;
    } catch (err) {
      // ignore
    }

    return null;
  }

  async getSubjectBySlug(slug: string): Promise<Subject | null> {
    try {
      const res = await fetch(`/api/subjects?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) return list[0] as Subject;
      }
    } catch (err) {
      // fallback to local
      try {
        const res = await fetch('/data/subjects.json');
        if (res.ok) {
          const local = await res.json();
          const found = (local as Subject[]).find(s => s.slug === slug);
          return found || null;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }

  async getMandatorySubjects(): Promise<Subject[]> {
    try {
      const res = await fetch('/api/subjects?mandatory=true');
      if (res.ok) return (await res.json()) as Subject[];
    } catch (err) {
      // ignore
    }
    return [];
  }

  async getLanguageSubjects(): Promise<Subject[]> {
    try {
      const res = await fetch('/api/subjects?category=LANGUAGE');
      if (res.ok) return (await res.json()) as Subject[];
    } catch (err) {
      // ignore
    }
    return [];
  }
}

export const subjectService = new SubjectService();
