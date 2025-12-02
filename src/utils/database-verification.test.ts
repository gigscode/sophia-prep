import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { verifyUserProfileTrigger, performStartupDatabaseChecks } from './database-verification';
import { supabase } from '../integrations/supabase/client';

// Mock the supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('database-verification', () => {
  let consoleWarnSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('verifyUserProfileTrigger', () => {
    it('should return true when user_profiles table is accessible', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await verifyUserProfileTrigger();

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('user_profiles');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot verify trigger from client side')
      );
    });

    it('should return false when user_profiles table is not accessible', async () => {
      const mockError = { message: 'Table not found' };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: mockError })
        })
      });

      const result = await verifyUserProfileTrigger();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot access user_profiles table'),
        mockError
      );
    });

    it('should handle exceptions gracefully', async () => {
      (supabase.from as any).mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await verifyUserProfileTrigger();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log verification guide reference', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      await verifyUserProfileTrigger();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('docs/TRIGGER_VERIFICATION_GUIDE.md')
      );
    });
  });

  describe('performStartupDatabaseChecks', () => {
    it('should log start and completion messages', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      await performStartupDatabaseChecks();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting database verification checks')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database verification checks completed')
      );
    });

    it('should log success when trigger verification passes', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      await performStartupDatabaseChecks();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('User profile trigger verification passed')
      );
    });

    it('should log warning when trigger verification fails', async () => {
      const mockError = { message: 'Table not found' };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: mockError })
        })
      });

      await performStartupDatabaseChecks();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: User profile trigger may be missing')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fallback mechanism will handle profile creation')
      );
    });

    it('should provide manual verification instructions on failure', async () => {
      const mockError = { message: 'Table not found' };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: mockError })
        })
      });

      await performStartupDatabaseChecks();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('To manually verify trigger in Supabase')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM pg_trigger')
      );
    });

    it('should handle exceptions without crashing', async () => {
      (supabase.from as any).mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(performStartupDatabaseChecks()).resolves.not.toThrow();

      // The error is logged from the fallback verification function
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fallback verification failed'),
        expect.any(Error)
      );
      // When verification fails (returns false), warning messages are logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: User profile trigger may be missing')
      );
    });

    it('should be non-blocking and complete successfully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null })
        })
      });

      const startTime = Date.now();
      await performStartupDatabaseChecks();
      const endTime = Date.now();

      // Should complete quickly (within 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
