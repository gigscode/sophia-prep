import { supabase } from '../integrations/supabase/client';

export interface TimerConfig {
  examType: 'JAMB' | 'WAEC';
  subjectSlug?: string;
  year?: number;
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
  exam_type: 'JAMB' | 'WAEC';
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
   * Get timer duration for a specific configuration
   * Falls back to default duration if specific config not found
   */
  async getDuration(config: TimerConfig): Promise<number> {
    try {
      // Try to find most specific configuration first
      // Priority: exam_type + subject + year > exam_type + subject > exam_type + year > exam_type
      
      const queries = [
        // Most specific: exam_type + subject + year
        config.subjectSlug && config.year ? {
          exam_type: config.examType,
          subject_slug: config.subjectSlug,
          year: config.year
        } : null,
        // exam_type + subject
        config.subjectSlug ? {
          exam_type: config.examType,
          subject_slug: config.subjectSlug,
          year: null
        } : null,
        // exam_type + year
        config.year ? {
          exam_type: config.examType,
          subject_slug: null,
          year: config.year
        } : null,
        // Default: exam_type only
        {
          exam_type: config.examType,
          subject_slug: null,
          year: null
        }
      ].filter(q => q !== null);

      for (const query of queries) {
        const { data, error } = await supabase
          .from('timer_configurations')
          .select('duration_seconds')
          .match(query as any)
          .maybeSingle();

        if (!error && data) {
          return (data as { duration_seconds: number }).duration_seconds;
        }
      }

      // Fallback to hardcoded defaults if database query fails
      return config.examType === 'JAMB' ? 2100 : 3600;
    } catch (error) {
      console.error('Error fetching timer duration:', error);
      // Return default durations on error
      return config.examType === 'JAMB' ? 2100 : 3600;
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
    examType: 'JAMB' | 'WAEC';
    subjectSlug?: string;
    year?: number;
    durationSeconds: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('timer_configurations')
        .upsert({
          exam_type: config.examType,
          subject_slug: config.subjectSlug || null,
          year: config.year || null,
          duration_seconds: config.durationSeconds
        } as any, {
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
