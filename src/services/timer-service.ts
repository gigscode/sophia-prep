import { supabase } from '../integrations/supabase/client';

export interface TimerConfig {
  examType: 'JAMB';
  subjectSlug?: string;
  year?: number;
  questionCount?: number; // For proportional timing calculation
}

export interface TimerHandle {
  id: number;
  pause: () => void;
  resume: () => void;
  getRemaining: () => number;
  stop: () => void;
}

interface TimerConfigEntry {
  id: string;
  exam_type: 'JAMB';
  subject_slug: string | null;
  year: number | null;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

class TimerService {
  private static readonly STORAGE_KEY = 'quiz_timer_end';
  private static readonly STORAGE_CONFIG_KEY = 'quiz_timer_config';

  /**
   * Calculate proportional duration for single-subject quizzes
   * Based on JAMB exam timing and actual question count
   *
   * JAMB: 2.5 hours (9000s) for 4 subjects, ~40 questions each
   */
  calculateProportionalDuration(config: {
    examType: 'JAMB';
    questionCount: number;
  }): number {
    // Base configuration for JAMB exam
    const baseConfig = {
      totalTime: 9000,      // 2.5 hours in seconds
      subjects: 4,          // JAMB has 4 subjects
      questionsPerSubject: 40
    };

    // Calculate time per subject in full exam
    const timePerSubject = baseConfig.totalTime / baseConfig.subjects;

    // Calculate time per question
    const timePerQuestion = timePerSubject / baseConfig.questionsPerSubject;

    // Calculate duration based on actual question count
    const calculatedDuration = timePerQuestion * config.questionCount;

    // Round to nearest 5 minutes (300 seconds) for user-friendliness
    const roundedDuration = Math.ceil(calculatedDuration / 300) * 300;

    // Ensure minimum of 5 minutes (300s) and maximum of full exam time
    return Math.max(300, Math.min(roundedDuration, baseConfig.totalTime));
  }

  /**
   * Get timer duration for a specific configuration
   * Falls back to proportional calculation if specific config not found
   */
  async getDuration(config: TimerConfig): Promise<number> {
    try {
      // Try to find most specific configuration first
      // Priority: exam_type + subject + year > exam_type + subject > exam_type + year > exam_type

      // Most specific: exam_type + subject + year
      if (config.subjectSlug && config.year) {
        const { data, error } = await supabase
          .from('timer_configurations')
          .select('duration_seconds')
          .eq('exam_type', config.examType)
          .eq('subject_slug', config.subjectSlug)
          .eq('year', config.year)
          .maybeSingle();

        if (!error && data) {
          return (data as { duration_seconds: number }).duration_seconds;
        }
      }

      // exam_type + subject (year is null)
      if (config.subjectSlug) {
        const { data, error } = await supabase
          .from('timer_configurations')
          .select('duration_seconds')
          .eq('exam_type', config.examType)
          .eq('subject_slug', config.subjectSlug)
          .is('year', null)
          .maybeSingle();

        if (!error && data) {
          return (data as { duration_seconds: number }).duration_seconds;
        }
      }

      // exam_type + year (subject_slug is null)
      if (config.year) {
        const { data, error } = await supabase
          .from('timer_configurations')
          .select('duration_seconds')
          .eq('exam_type', config.examType)
          .is('subject_slug', null)
          .eq('year', config.year)
          .maybeSingle();

        if (!error && data) {
          return (data as { duration_seconds: number }).duration_seconds;
        }
      }

      // Default: exam_type only (both subject_slug and year are null)
      const { data, error } = await supabase
        .from('timer_configurations')
        .select('duration_seconds')
        .eq('exam_type', config.examType)
        .is('subject_slug', null)
        .is('year', null)
        .maybeSingle();

      if (!error && data) {
        return (data as { duration_seconds: number }).duration_seconds;
      }

      // If no database config found and questionCount is provided, use proportional calculation
      if (config.questionCount && config.questionCount > 0) {
        console.log(`No timer config found, calculating proportional duration for ${config.questionCount} questions`);
        return this.calculateProportionalDuration({
          examType: config.examType,
          questionCount: config.questionCount
        });
      }

      // Fallback to hardcoded default for JAMB
      return 2100; // 35 minutes default
    } catch (error) {
      console.error('Error fetching timer duration:', error);

      // Try proportional calculation as fallback
      if (config.questionCount && config.questionCount > 0) {
        return this.calculateProportionalDuration({
          examType: config.examType,
          questionCount: config.questionCount
        });
      }

      // Return default duration for JAMB on error
      return 2100; // 35 minutes default
    }
  }

  /**
   * Start a countdown timer
   * Persists timer state to localStorage for recovery on page reload
   */
  startTimer(
    duration: number,
    onTick: (remaining: number) => void,
    onExpire: () => void
  ): TimerHandle {
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    // Persist to localStorage
    localStorage.setItem(TimerService.STORAGE_KEY, endTime.toString());

    let isPaused = false;
    let pausedRemaining = 0;

    const interval = setInterval(() => {
      if (isPaused) return;

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      onTick(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        localStorage.removeItem(TimerService.STORAGE_KEY);
        onExpire();
      }
    }, 1000);

    const handle: TimerHandle = {
      id: interval as unknown as number,
      pause: () => {
        if (!isPaused) {
          isPaused = true;
          pausedRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        }
      },
      resume: () => {
        if (isPaused) {
          isPaused = false;
          const newEndTime = Date.now() + (pausedRemaining * 1000);
          localStorage.setItem(TimerService.STORAGE_KEY, newEndTime.toString());
        }
      },
      getRemaining: () => {
        if (isPaused) {
          return pausedRemaining;
        }
        return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      },
      stop: () => {
        clearInterval(interval);
        localStorage.removeItem(TimerService.STORAGE_KEY);
      }
    };

    return handle;
  }

  /**
   * Stop a running timer
   */
  stopTimer(handle: TimerHandle): void {
    handle.stop();
  }

  /**
   * Restore timer state from localStorage
   * Returns remaining seconds if timer is still active, null otherwise
   */
  restoreTimer(): number | null {
    const endTimeStr = localStorage.getItem(TimerService.STORAGE_KEY);
    
    if (!endTimeStr) return null;

    const endTime = parseInt(endTimeStr, 10);
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

    if (remaining === 0) {
      localStorage.removeItem(TimerService.STORAGE_KEY);
      return null;
    }

    return remaining;
  }

  /**
   * Clear any persisted timer state
   */
  clearPersistedTimer(): void {
    localStorage.removeItem(TimerService.STORAGE_KEY);
    localStorage.removeItem(TimerService.STORAGE_CONFIG_KEY);
  }

  /**
   * Format seconds into MM:SS format
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get all timer configurations (for admin purposes)
   */
  async getAllConfigurations(): Promise<TimerConfigEntry[]> {
    try {
      const { data, error } = await supabase
        .from('timer_configurations')
        .select('*')
        .order('exam_type', { ascending: true })
        .order('subject_slug', { ascending: true, nullsFirst: true })
        .order('year', { ascending: true, nullsFirst: true });

      if (error) {
        console.error('Error fetching timer configurations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllConfigurations:', error);
      return [];
    }
  }

  /**
   * Create or update a timer configuration (admin function)
   */
  async upsertConfiguration(config: {
    examType: 'JAMB';
    subjectSlug?: string;
    year?: number;
    durationSeconds: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase
        .from('timer_configurations')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert as any)({
          exam_type: config.examType,
          subject_slug: config.subjectSlug || null,
          year: config.year || null,
          duration_seconds: config.durationSeconds
        }, {
          onConflict: 'exam_type,subject_slug,year'
        });

      if (error) {
        console.error('Error upserting timer configuration:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in upsertConfiguration:', error);
      return { success: false, error: 'Failed to save timer configuration' };
    }
  }
}

export const timerService = new TimerService();
