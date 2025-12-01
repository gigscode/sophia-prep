export type ExamType = 'JAMB' | 'WAEC' | 'BOTH';
export type SubjectCategory = 'SCIENCE' | 'COMMERCIAL' | 'ARTS' | 'GENERAL' | 'LANGUAGE';
export type CombinationType = 'SCIENCE' | 'COMMERCIAL' | 'ARTS' | 'CUSTOM';

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color_theme: string;
  exam_type: ExamType;
  subject_category: SubjectCategory;
  is_mandatory: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubjectCombination {
  id: string;
  user_id: string;
  exam_type: ExamType;
  combination_type: CombinationType;
  subjects: string[]; // Array of subject IDs
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CorrectAnswer = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  topic_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: CorrectAnswer;
  explanation: string | null;
  exam_year: number | null;
  exam_type: 'JAMB' | 'WAEC' | null;
  question_number: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimerConfiguration {
  id: string;
  exam_type: 'JAMB' | 'WAEC';
  subject_slug: string | null;
  year: number | null;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subject, 'id' | 'created_at' | 'updated_at'>>;
      };
      subject_combinations: {
        Row: SubjectCombination;
        Insert: Omit<SubjectCombination, 'id' | 'created_at'>;
        Update: Partial<Omit<SubjectCombination, 'id' | 'created_at'>>;
      };
      topics: {
        Row: Topic;
        Insert: Omit<Topic, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Question, 'id' | 'created_at' | 'updated_at'>>;
      };
      timer_configurations: {
        Row: TimerConfiguration;
        Insert: Omit<TimerConfiguration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TimerConfiguration, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
