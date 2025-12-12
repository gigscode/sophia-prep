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
  subject_id: string | null;
  topic_id: string | null;
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
      questions_new: {
        Row: {
          id: string;
          subject_id: string;
          exam_type_id: string | null;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: 'A' | 'B' | 'C' | 'D';
          explanation: string | null;
          difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
          exam_year: number | null;
          question_number: number | null;
          metadata: any | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<{
          id: string;
          subject_id: string;
          exam_type_id: string | null;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: 'A' | 'B' | 'C' | 'D';
          explanation: string | null;
          difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
          exam_year: number | null;
          question_number: number | null;
          metadata: any | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<{
          id: string;
          subject_id: string;
          exam_type_id: string | null;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: 'A' | 'B' | 'C' | 'D';
          explanation: string | null;
          difficulty_level: 'EASY' | 'MEDIUM' | 'HARD';
          exam_year: number | null;
          question_number: number | null;
          metadata: any | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }, 'id' | 'created_at' | 'updated_at'>>;
      };
      quiz_attempts_new: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          exam_type_id: string | null;
          quiz_mode: 'PRACTICE' | 'CBT_EXAM';
          total_questions: number;
          questions_requested: number | null;
          correct_answers: number;
          incorrect_answers: number;
          score_percentage: number;
          time_taken_seconds: number;
          time_limit_seconds: number | null;
          is_auto_submitted: boolean;
          exam_year: number | null;
          questions_data: any[];
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          exam_type_id?: string | null;
          quiz_mode: 'PRACTICE' | 'CBT_EXAM';
          total_questions: number;
          questions_requested?: number | null;
          correct_answers: number;
          incorrect_answers: number;
          score_percentage: number;
          time_taken_seconds: number;
          time_limit_seconds?: number | null;
          is_auto_submitted?: boolean;
          exam_year?: number | null;
          questions_data?: any[];
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id?: string;
          user_id: string;
          subject_id?: string | null;
          exam_type_id?: string | null;
          quiz_mode: 'PRACTICE' | 'CBT_EXAM';
          total_questions: number;
          questions_requested?: number | null;
          correct_answers: number;
          incorrect_answers: number;
          score_percentage: number;
          time_taken_seconds: number;
          time_limit_seconds?: number | null;
          is_auto_submitted?: boolean;
          exam_year?: number | null;
          questions_data?: any[];
          completed_at?: string | null;
          created_at?: string;
        }>;
      };
      timer_configurations: {
        Row: TimerConfiguration;
        Insert: Omit<TimerConfiguration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TimerConfiguration, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          subscription_plan: string | null;
          created_at: string;
          last_login: string | null;
          is_active: boolean;
          exam_type: 'JAMB' | 'WAEC' | 'BOTH' | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          subscription_plan?: string | null;
          created_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          exam_type?: 'JAMB' | 'WAEC' | 'BOTH' | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          subscription_plan?: string | null;
          created_at?: string;
          last_login?: string | null;
          is_active?: boolean;
          exam_type?: 'JAMB' | 'WAEC' | 'BOTH' | null;
        };
      };
    };
    Functions: {
      get_practice_questions: {
        Args: {
          p_subject_ids: string[];
          p_limit: number;
          p_difficulty: string | null;
        };
        Returns: {
          question_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string | null;
          difficulty_level: string;
          subject_name: string;
        }[];
      };
      get_cbt_questions_by_year: {
        Args: {
          p_exam_type_slug: string;
          p_subject_ids: string[];
          p_exam_year: number;
          p_requested_questions: number | null;
        };
        Returns: {
          question_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string | null;
          difficulty_level: string;
          subject_name: string;
          exam_type_name: string;
          questions_count: number;
          time_limit_minutes: number;
          is_valid: boolean;
          message: string;
        }[];
      };
      get_cbt_exam_questions_with_validation: {
        Args: {
          p_exam_type_slug: string;
          p_subject_ids: string[];
          p_requested_questions: number | null;
        };
        Returns: {
          question_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string | null;
          difficulty_level: string;
          subject_name: string;
          exam_type_name: string;
          questions_count: number;
          time_limit_minutes: number;
          is_valid: boolean;
          message: string;
        }[];
      };
      get_available_exam_years: {
        Args: {
          p_exam_type_slug: string;
          p_subject_ids: string[] | null;
        };
        Returns: {
          exam_year: number;
          question_count: number;
          subjects_with_questions: string[];
        }[];
      };
      get_jamb_cbt_questions: {
        Args: {
          p_subject_ids: string[];
          p_questions_per_subject: number;
          p_total_questions: number | null;
        };
        Returns: {
          question_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          explanation: string | null;
          difficulty_level: string;
          subject_name: string;
          exam_type_name: string;
          questions_count: number;
          time_limit_minutes: number;
          is_valid: boolean;
          message: string;
        }[];
      };
    };
  };
}
