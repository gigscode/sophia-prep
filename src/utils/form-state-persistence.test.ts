/**
 * Unit Tests for Form State Preservation
 * 
 * Tests specific form data preservation scenarios to ensure
 * form state is properly saved and restored across page refreshes.
 * 
 * Requirements: 1.4 - Form state preservation where feasible
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  FormStatePersistence, 
  GlobalFormStateManager,
  formStateUtils,
  createFormPersistence,
  formConfigurations
} from './form-state-persistence';

// Mock localStorage and sessionStorage
const createStorageMock = () => {
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
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
};

describe('Form State Persistence', () => {
  let mockLocalStorage: ReturnType<typeof createStorageMock>;
  let mockSessionStorage: ReturnType<typeof createStorageMock>;

  beforeEach(() => {
    mockLocalStorage = createStorageMock();
    mockSessionStorage = createStorageMock();
    
    // Mock global storage objects
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FormStatePersistence Class', () => {
    it('should save and restore login form state (email only)', () => {
      const formPersistence = new FormStatePersistence(formConfigurations.login);
      
      const formData = {
        email: 'test@example.com',
        password: 'secret123' // Should not be persisted
      };

      // Save form state
      const saved = formPersistence.saveFormState(formData);
      expect(saved).toBe(true);

      // Verify localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'form_login',
        expect.stringContaining('test@example.com')
      );

      // Restore form state
      const restored = formPersistence.restoreFormState();
      expect(restored).toEqual({
        email: 'test@example.com'
        // password should not be included
      });
    });

    it('should save and restore signup form state (name and email only)', () => {
      const formPersistence = new FormStatePersistence(formConfigurations.signup);
      
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123' // Should not be persisted
      };

      // Save form state
      formPersistence.saveFormState(formData);

      // Restore form state
      const restored = formPersistence.restoreFormState();
      expect(restored).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
        // password should not be included
      });
    });

    it('should save and restore import questions form state', () => {
      const formPersistence = new FormStatePersistence(formConfigurations.importQuestions);
      
      const formData = {
        selectedSubject: 'math-001',
        selectedExamType: 'JAMB',
        selectedExamYear: '2023',
        format: 'json',
        importMode: 'file'
      };

      // Save form state
      formPersistence.saveFormState(formData);

      // Restore form state
      const restored = formPersistence.restoreFormState();
      expect(restored).toEqual(formData);
    });

    it('should handle expired form state', () => {
      const formPersistence = new FormStatePersistence({
        ...formConfigurations.login,
        maxAge: 1000 // 1 second
      });
      
      const formData = { email: 'test@example.com' };
      
      // Save form state
      formPersistence.saveFormState(formData);

      // Mock time passing (2 seconds later)
      vi.spyOn(Date, 'now').mockReturnValue(1000000 + 2000);

      // Try to restore - should return null due to expiration
      const restored = formPersistence.restoreFormState();
      expect(restored).toBeNull();

      // Verify expired data was cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form_login');
    });

    it('should not save sensitive fields', () => {
      const formPersistence = new FormStatePersistence({
        formId: 'test',
        fields: [
          { name: 'email', type: 'email', persist: true },
          { name: 'password', type: 'password', persist: false, sensitive: true },
          { name: 'creditCard', type: 'text', persist: true, sensitive: true }
        ],
        storage: 'localStorage'
      });
      
      const formData = {
        email: 'test@example.com',
        password: 'secret123',
        creditCard: '1234-5678-9012-3456'
      };

      // Save form state
      formPersistence.saveFormState(formData);

      // Restore form state - should only include email
      const restored = formPersistence.restoreFormState();
      expect(restored).toEqual({
        email: 'test@example.com'
      });
    });

    it('should handle auto-save with debouncing', (done) => {
      const formPersistence = new FormStatePersistence({
        ...formConfigurations.login,
        autoSaveDelay: 100
      });
      
      const formData = { email: 'test@example.com' };
      
      // Trigger auto-save multiple times quickly
      formPersistence.autoSaveFormState(formData);
      formPersistence.autoSaveFormState(formData);
      formPersistence.autoSaveFormState(formData);

      // Should not save immediately
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Wait for debounce delay
      setTimeout(() => {
        // Should save only once after debounce
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    it('should clear form state', () => {
      const formPersistence = new FormStatePersistence(formConfigurations.login);
      
      // Save some data first
      formPersistence.saveFormState({ email: 'test@example.com' });
      
      // Clear form state
      formPersistence.clearFormState();
      
      // Verify removal was called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form_login');
      
      // Verify no data is restored
      const restored = formPersistence.restoreFormState();
      expect(restored).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      // Mock storage to throw errors
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const onError = vi.fn();
      const formPersistence = new FormStatePersistence({
        ...formConfigurations.login,
        onError
      });
      
      const formData = { email: 'test@example.com' };
      
      // Should not throw, but return false
      const saved = formPersistence.saveFormState(formData);
      expect(saved).toBe(false);
      expect(onError).toHaveBeenCalledWith('Storage quota exceeded');
    });
  });

  describe('createFormPersistence Helper', () => {
    it('should create form persistence with predefined configuration', () => {
      const formPersistence = createFormPersistence('login');
      
      // Test that it uses the login configuration
      const formData = { email: 'test@example.com', password: 'secret' };
      formPersistence.saveFormState(formData);
      
      const restored = formPersistence.restoreFormState();
      expect(restored).toEqual({ email: 'test@example.com' });
    });

    it('should allow custom configuration overrides', () => {
      const formPersistence = createFormPersistence('login', {
        storage: 'sessionStorage',
        maxAge: 5000
      });
      
      const formData = { email: 'test@example.com' };
      formPersistence.saveFormState(formData);
      
      // Should use sessionStorage instead of localStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('GlobalFormStateManager', () => {
    let manager: GlobalFormStateManager;

    beforeEach(() => {
      manager = new GlobalFormStateManager();
    });

    afterEach(() => {
      manager.cleanup();
    });

    it('should register and manage multiple forms', () => {
      const loginForm = manager.registerForm(formConfigurations.login);
      const signupForm = manager.registerForm(formConfigurations.signup);
      
      expect(loginForm).toBeInstanceOf(FormStatePersistence);
      expect(signupForm).toBeInstanceOf(FormStatePersistence);
      
      // Should be able to retrieve forms
      expect(manager.getForm('login')).toBe(loginForm);
      expect(manager.getForm('signup')).toBe(signupForm);
    });

    it('should clear all form states', () => {
      const loginForm = manager.registerForm(formConfigurations.login);
      const signupForm = manager.registerForm(formConfigurations.signup);
      
      // Save some data
      loginForm.saveFormState({ email: 'login@example.com' });
      signupForm.saveFormState({ email: 'signup@example.com', name: 'Test User' });
      
      // Clear all
      manager.clearAllFormStates();
      
      // Verify all forms were cleared
      expect(loginForm.restoreFormState()).toBeNull();
      expect(signupForm.restoreFormState()).toBeNull();
    });

    it('should get all form states for debugging', () => {
      const loginForm = manager.registerForm(formConfigurations.login);
      const signupForm = manager.registerForm(formConfigurations.signup);
      
      // Save some data
      loginForm.saveFormState({ email: 'login@example.com' });
      signupForm.saveFormState({ email: 'signup@example.com', name: 'Test User' });
      
      const allStates = manager.getAllFormStates();
      
      expect(allStates).toHaveProperty('login');
      expect(allStates).toHaveProperty('signup');
      expect(allStates.login?.fields).toEqual({ email: 'login@example.com' });
      expect(allStates.signup?.fields).toEqual({ email: 'signup@example.com', name: 'Test User' });
    });
  });

  describe('Form State Utils', () => {
    beforeEach(() => {
      // Add some test data to storage
      mockLocalStorage.setItem('form_test1', JSON.stringify({
        formId: 'test1',
        fields: { email: 'test1@example.com' },
        timestamp: Date.now() - 1000,
        url: 'http://localhost/test1'
      }));
      
      mockLocalStorage.setItem('form_test2', JSON.stringify({
        formId: 'test2',
        fields: { name: 'Test User' },
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago (expired)
        url: 'http://localhost/test2'
      }));
      
      mockSessionStorage.setItem('form_session1', JSON.stringify({
        formId: 'session1',
        fields: { message: 'Hello' },
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago (expired for session)
        url: 'http://localhost/session1'
      }));
    });

    it('should clear expired form states', () => {
      formStateUtils.clearExpiredFormStates();
      
      // Should remove expired entries
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form_test2');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('form_session1');
      
      // Should keep non-expired entries
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('form_test1');
    });

    it('should get all stored form states', () => {
      const allStates = formStateUtils.getAllStoredFormStates();
      
      expect(allStates).toHaveProperty('form_test1');
      expect(allStates).toHaveProperty('form_test2');
      expect(allStates).toHaveProperty('form_session1');
      
      expect(allStates['form_test1'].fields).toEqual({ email: 'test1@example.com' });
    });

    it('should clear all form states from storage', () => {
      formStateUtils.clearAllFormStates();
      
      // Should remove all form-related keys
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form_test1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('form_test2');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('form_session1');
    });
  });

  describe('Real-world Form Integration Scenarios', () => {
    it('should preserve login form state across page refresh simulation', () => {
      // Simulate user filling login form
      const loginForm = createFormPersistence('login');
      
      // User saves form state (simulating auto-save completion)
      loginForm.saveFormState({ email: 'user@example.com' });
      
      // Simulate page refresh - create new instance
      const newLoginForm = createFormPersistence('login');
      const restored = newLoginForm.restoreFormState();
      
      expect(restored).toEqual({ email: 'user@example.com' });
    });

    it('should preserve import questions form state across navigation', () => {
      // Simulate user configuring import form
      const importForm = createFormPersistence('importQuestions');
      
      const formData = {
        selectedSubject: 'mathematics',
        selectedExamType: 'JAMB',
        selectedExamYear: '2023',
        format: 'json',
        importMode: 'file'
      };
      
      importForm.saveFormState(formData);
      
      // Simulate navigation away and back
      const newImportForm = createFormPersistence('importQuestions');
      const restored = newImportForm.restoreFormState();
      
      expect(restored).toEqual(formData);
    });

    it('should handle form state cleanup on successful submission', () => {
      const loginForm = createFormPersistence('login');
      
      // User fills form
      loginForm.saveFormState({ email: 'user@example.com' });
      
      // Verify state exists
      expect(loginForm.hasFormState()).toBe(true);
      
      // Simulate successful login - clear state
      loginForm.clearFormState();
      
      // Verify state is cleared
      expect(loginForm.hasFormState()).toBe(false);
      expect(loginForm.restoreFormState()).toBeNull();
    });

    it('should handle multiple forms independently', () => {
      const loginForm = createFormPersistence('login');
      const signupForm = createFormPersistence('signup');
      const forgotPasswordForm = createFormPersistence('forgotPassword');
      
      // Save different data to each form
      loginForm.saveFormState({ email: 'login@example.com' });
      signupForm.saveFormState({ name: 'John Doe', email: 'signup@example.com' });
      forgotPasswordForm.saveFormState({ email: 'forgot@example.com' });
      
      // Verify each form maintains its own state
      expect(loginForm.restoreFormState()).toEqual({ email: 'login@example.com' });
      expect(signupForm.restoreFormState()).toEqual({ name: 'John Doe', email: 'signup@example.com' });
      expect(forgotPasswordForm.restoreFormState()).toEqual({ email: 'forgot@example.com' });
      
      // Clear one form shouldn't affect others
      loginForm.clearFormState();
      
      expect(loginForm.restoreFormState()).toBeNull();
      expect(signupForm.restoreFormState()).toEqual({ name: 'John Doe', email: 'signup@example.com' });
      expect(forgotPasswordForm.restoreFormState()).toEqual({ email: 'forgot@example.com' });
    });
  });
});