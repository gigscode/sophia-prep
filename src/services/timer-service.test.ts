import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { timerService, TimerConfig } from './timer-service';

describe('TimerService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getDuration', () => {
    it('should return default JAMB duration when no specific config exists', async () => {
      const config: TimerConfig = { examType: 'JAMB' };
      const duration = await timerService.getDuration(config);
      
      // Should return 2100 seconds (35 minutes) for JAMB
      expect(duration).toBe(2100);
    });

    it('should return default WAEC duration when no specific config exists', async () => {
      const config: TimerConfig = { examType: 'WAEC' };
      const duration = await timerService.getDuration(config);
      
      // Should return 3600 seconds (60 minutes) for WAEC
      expect(duration).toBe(3600);
    });

    it('should handle subject-specific configuration', async () => {
      const config: TimerConfig = {
        examType: 'JAMB',
        subjectSlug: 'mathematics'
      };
      
      const duration = await timerService.getDuration(config);
      
      // Should return a positive duration
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle year-specific configuration', async () => {
      const config: TimerConfig = {
        examType: 'WAEC',
        year: 2023
      };
      
      const duration = await timerService.getDuration(config);
      
      // Should return a positive duration
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('startTimer', () => {
    it('should call onTick callback every second', () => {
      const onTick = vi.fn();
      const onExpire = vi.fn();
      
      const handle = timerService.startTimer(5, onTick, onExpire);
      
      // Advance time by 1 second
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledWith(4);
      
      // Advance time by another second
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledWith(3);
      
      handle.stop();
    });

    it('should call onExpire when timer reaches zero', () => {
      const onTick = vi.fn();
      const onExpire = vi.fn();
      
      timerService.startTimer(2, onTick, onExpire);
      
      // Advance time to expiration
      vi.advanceTimersByTime(2000);
      
      expect(onExpire).toHaveBeenCalled();
    });

    it('should persist timer end time to localStorage', () => {
      const onTick = vi.fn();
      const onExpire = vi.fn();
      
      timerService.startTimer(60, onTick, onExpire);
      
      const endTime = localStorage.getItem('quiz_timer_end');
      expect(endTime).toBeTruthy();
      expect(parseInt(endTime!, 10)).toBeGreaterThan(Date.now());
    });

    it('should support pause and resume', () => {
      const onTick = vi.fn();
      const onExpire = vi.fn();
      
      const handle = timerService.startTimer(10, onTick, onExpire);
      
      // Advance 2 seconds
      vi.advanceTimersByTime(2000);
      expect(onTick).toHaveBeenLastCalledWith(8);
      
      // Pause
      handle.pause();
      
      // Advance 2 more seconds (should not tick)
      vi.advanceTimersByTime(2000);
      expect(onTick).toHaveBeenCalledTimes(2); // Still only 2 calls
      
      // Resume
      handle.resume();
      
      // Advance 1 second (should tick again)
      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(3);
      
      handle.stop();
    });

    it('should return remaining time via getRemaining', () => {
      const onTick = vi.fn();
      const onExpire = vi.fn();
      
      const handle = timerService.startTimer(10, onTick, onExpire);
      
      // Advance 3 seconds
      vi.advanceTimersByTime(3000);
      
      const remaining = handle.getRemaining();
      expect(remaining).toBeGreaterThanOrEqual(6);
      expect(remaining).toBeLessThanOrEqual(7);
      
      handle.stop();
    });
  });

  describe('stopTimer', () => {
    it('should stop the timer and clear localStorage', () => {
      const onTick = vi.fn();
      const onExpire = vi.fn();
      
      const handle = timerService.startTimer(60, onTick, onExpire);
      
      expect(localStorage.getItem('quiz_timer_end')).toBeTruthy();
      
      timerService.stopTimer(handle);
      
      expect(localStorage.getItem('quiz_timer_end')).toBeNull();
    });
  });

  describe('restoreTimer', () => {
    it('should return null when no timer is persisted', () => {
      const remaining = timerService.restoreTimer();
      expect(remaining).toBeNull();
    });

    it('should return remaining time when timer is persisted', () => {
      // Set a timer that expires in 30 seconds
      const endTime = Date.now() + 30000;
      localStorage.setItem('quiz_timer_end', endTime.toString());
      
      const remaining = timerService.restoreTimer();
      
      expect(remaining).toBeGreaterThanOrEqual(29);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    it('should return null and clear storage when timer has expired', () => {
      // Set a timer that expired 5 seconds ago
      const endTime = Date.now() - 5000;
      localStorage.setItem('quiz_timer_end', endTime.toString());
      
      const remaining = timerService.restoreTimer();
      
      expect(remaining).toBeNull();
      expect(localStorage.getItem('quiz_timer_end')).toBeNull();
    });
  });

  describe('formatTime', () => {
    it('should format seconds as MM:SS', () => {
      expect(timerService.formatTime(0)).toBe('00:00');
      expect(timerService.formatTime(59)).toBe('00:59');
      expect(timerService.formatTime(60)).toBe('01:00');
      expect(timerService.formatTime(125)).toBe('02:05');
      expect(timerService.formatTime(3599)).toBe('59:59');
      expect(timerService.formatTime(3600)).toBe('60:00');
    });
  });

  describe('clearPersistedTimer', () => {
    it('should clear all timer-related localStorage items', () => {
      localStorage.setItem('quiz_timer_end', '12345');
      localStorage.setItem('quiz_timer_config', 'test');
      
      timerService.clearPersistedTimer();
      
      expect(localStorage.getItem('quiz_timer_end')).toBeNull();
      expect(localStorage.getItem('quiz_timer_config')).toBeNull();
    });
  });
});
