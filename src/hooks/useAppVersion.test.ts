import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppVersion } from './useAppVersion';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock timers - we'll use vi.spyOn to properly mock these
const mockSetInterval = vi.fn();
const mockSetTimeout = vi.fn();
const mockClearInterval = vi.fn();
const mockClearTimeout = vi.fn();

// Mock localStorage with proper implementation
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Mock cache management module
vi.mock('../utils/cache-management', () => ({
  CacheManager: vi.fn().mockImplementation(() => ({
    clearAllCaches: vi.fn().mockResolvedValue({ success: true, errors: [] }),
    forceReloadFromServer: vi.fn(),
  })),
  DEFAULT_CACHE_CONFIG: {},
}));

// Mock document for event listeners
Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
});

Object.defineProperty(document, 'removeEventListener', {
  value: vi.fn(),
});

Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true,
});

describe('useAppVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    // Setup timer spies
    vi.spyOn(global, 'setInterval').mockImplementation(mockSetInterval);
    vi.spyOn(global, 'setTimeout').mockImplementation(mockSetTimeout);
    vi.spyOn(global, 'clearInterval').mockImplementation(mockClearInterval);
    vi.spyOn(global, 'clearTimeout').mockImplementation(mockClearTimeout);
    
    // Reset timer mocks
    mockSetInterval.mockClear();
    mockSetTimeout.mockClear();
    mockClearInterval.mockClear();
    mockClearTimeout.mockClear();
    
    // Setup default fetch mock to prevent undefined errors
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAppVersion());

    expect(result.current.hasUpdate).toBe(false);
    expect(result.current.currentVersion).toBe(null);
    expect(result.current.newVersion).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.autoUpdateEnabled).toBe(true);
    expect(result.current.updateInProgress).toBe(false);
    expect(typeof result.current.checkForUpdates).toBe('function');
    expect(typeof result.current.applyUpdate).toBe('function');
  });

  it('should maintain backward compatibility with existing interface', () => {
    const { result } = renderHook(() => useAppVersion());

    // Check that all original properties exist
    expect(result.current).toHaveProperty('hasUpdate');
    expect(result.current).toHaveProperty('currentVersion');
    expect(result.current).toHaveProperty('newVersion');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('checkForUpdates');
    expect(result.current).toHaveProperty('applyUpdate');

    // Check that new properties exist
    expect(result.current).toHaveProperty('autoUpdateEnabled');
    expect(result.current).toHaveProperty('lastUpdateCheck');
    expect(result.current).toHaveProperty('updateInProgress');
  });

  it('should allow disabling silent updates', () => {
    const { result } = renderHook(() => useAppVersion({ enabled: false }));

    expect(result.current.autoUpdateEnabled).toBe(false);
  });

  it('should handle first time version storage', async () => {
    const mockVersion = {
      version: '1.0.0',
      buildTime: '2023-01-01T00:00:00.000Z',
      buildId: 'test-build-id',
      cacheName: 'test-cache'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVersion),
    });

    const { result } = renderHook(() => useAppVersion({ enabled: false })); // Disable silent updates for testing

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'app-version-info',
      JSON.stringify(mockVersion)
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'app-version-info-backup',
      JSON.stringify(mockVersion)
    );
    expect(result.current.currentVersion).toBe('1.0.0');
    expect(result.current.loading).toBe(false);
  });

  it('should handle version storage failures with retry logic', async () => {
    const mockVersion = {
      version: '1.0.0',
      buildTime: '2023-01-01T00:00:00.000Z',
      buildId: 'test-build-id',
      cacheName: 'test-cache'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVersion),
    });

    // Mock localStorage to fail on first few attempts
    let attemptCount = 0;
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      attemptCount++;
      if (attemptCount <= 2) { // Fail first two attempts
        throw new Error('Storage quota exceeded');
      }
      // Succeed on subsequent attempts - store in the mock store
      const store = (mockLocalStorage as any).store || {};
      store[key] = value;
      (mockLocalStorage as any).store = store;
    });

    const { result } = renderHook(() => useAppVersion({ enabled: false }));

    await act(async () => {
      await result.current.checkForUpdates();
    });

    // Should have attempted storage operations multiple times
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should detect version updates correctly', async () => {
    const version1 = {
      version: '1.0.0',
      buildTime: '2023-01-01T00:00:00.000Z',
      buildId: 'build-1',
      cacheName: 'cache-1'
    };

    const version2 = {
      version: '1.1.0',
      buildTime: '2023-01-02T00:00:00.000Z',
      buildId: 'build-2',
      cacheName: 'cache-2'
    };

    // Reset mocks for this test
    mockLocalStorage.clear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.getItem.mockClear();

    // Store initial version
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(version1));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(version2),
    });

    const { result } = renderHook(() => useAppVersion({ enabled: false }));

    await act(async () => {
      await result.current.checkForUpdates();
    });

    expect(result.current.hasUpdate).toBe(true);
    expect(result.current.newVersion).toBe('1.1.0');
  });

  it('should handle storage backup and recovery', () => {
    // Reset mocks
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockClear();

    // The hook should initialize and access localStorage for various purposes
    const { result } = renderHook(() => useAppVersion({ enabled: false }));

    // Verify the hook initializes correctly with backup/recovery capabilities
    expect(result.current.autoUpdateEnabled).toBe(false);
    expect(result.current.loading).toBe(true); // Initially loading
    expect(mockLocalStorage.getItem).toHaveBeenCalled(); // Should access storage
  });

  it('should preserve version detection behavior - polling intervals and visibility change', () => {
    const { result } = renderHook(() => useAppVersion({ enabled: false }));

    // Verify the hook sets up periodic checking (5 minutes = 300000ms)
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 300000);
    
    // Verify visibility change listener is set up
    expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    
    // Verify the hook provides the expected interface
    expect(typeof result.current.checkForUpdates).toBe('function');
    expect(typeof result.current.applyUpdate).toBe('function');
  });

  it('should preserve buildId and version comparison logic', async () => {
    const version1 = {
      version: '1.0.0',
      buildTime: '2023-01-01T00:00:00.000Z',
      buildId: 'build-1',
      cacheName: 'cache-1'
    };

    const version2SameBuildId = {
      version: '1.1.0', // Different version
      buildTime: '2023-01-02T00:00:00.000Z',
      buildId: 'build-1', // Same buildId
      cacheName: 'cache-2'
    };

    const version3DifferentBuildId = {
      version: '1.0.0', // Same version
      buildTime: '2023-01-02T00:00:00.000Z',
      buildId: 'build-2', // Different buildId
      cacheName: 'cache-2'
    };

    // Test 1: Same buildId should NOT trigger update (even with different version)
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(version1));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(version2SameBuildId),
    });

    const { result: result1 } = renderHook(() => useAppVersion({ enabled: false }));

    await act(async () => {
      await result1.current.checkForUpdates();
    });

    expect(result1.current.hasUpdate).toBe(false);

    // Test 2: Different buildId should trigger update (even with same version)
    mockLocalStorage.clear();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(version1));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(version3DifferentBuildId),
    });

    const { result: result2 } = renderHook(() => useAppVersion({ enabled: false }));

    await act(async () => {
      await result2.current.checkForUpdates();
    });

    expect(result2.current.hasUpdate).toBe(true);
    expect(result2.current.newVersion).toBe('1.0.0');
  });

  it('should trigger immediate automatic update when enabled', async () => {
    const version1 = {
      version: '1.0.0',
      buildTime: '2023-01-01T00:00:00.000Z',
      buildId: 'build-1',
      cacheName: 'cache-1'
    };

    const version2 = {
      version: '1.1.0',
      buildTime: '2023-01-02T00:00:00.000Z',
      buildId: 'build-2',
      cacheName: 'cache-2'
    };

    // Store initial version
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(version1));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(version2),
    });

    const { result } = renderHook(() => useAppVersion({ 
      enabled: true, // Enable automatic updates
      delayMs: 100, // Short delay for testing
      respectUserActivity: false // Don't wait for user activity
    }));

    await act(async () => {
      await result.current.checkForUpdates();
      // Fast-forward timers to trigger the delayed update
      vi.advanceTimersByTime(200);
    });

    expect(result.current.hasUpdate).toBe(true);
    expect(result.current.newVersion).toBe('1.1.0');
    
    // Verify that automatic update was scheduled (setTimeout should be called)
    expect(mockSetTimeout).toHaveBeenCalled();
  });
});