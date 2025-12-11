/**
 * Form State Persistence Utility
 * 
 * Provides localStorage-based form state persistence for key forms,
 * session storage for temporary page state, and state recovery utilities
 * for page refreshes.
 * 
 * Requirements: 1.4 - Form state preservation where feasible
 */

/**
 * Form field configuration for persistence
 */
export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  persist: boolean; // Whether to persist this field
  sensitive?: boolean; // Whether this field contains sensitive data (passwords, etc.)
  maxAge?: number; // Maximum age in milliseconds before expiring
}

/**
 * Form state snapshot
 */
export interface FormStateSnapshot {
  formId: string;
  fields: Record<string, any>;
  timestamp: number;
  url: string; // URL where the form was filled
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Form persistence configuration
 */
export interface FormPersistenceConfig {
  formId: string;
  fields: FormFieldConfig[];
  storage: 'localStorage' | 'sessionStorage';
  maxAge?: number; // Default max age for all fields
  autoSave?: boolean; // Whether to auto-save on field changes
  autoSaveDelay?: number; // Delay in ms for auto-save debouncing
  onSave?: (snapshot: FormStateSnapshot) => void;
  onRestore?: (snapshot: FormStateSnapshot) => void;
  onError?: (error: string) => void;
}

/**
 * Form state persistence manager
 */
export class FormStatePersistence {
  private config: FormPersistenceConfig;
  private storageKey: string;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor(config: FormPersistenceConfig) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
      autoSave: true,
      autoSaveDelay: 1000, // 1 second default
      ...config
    };
    this.storageKey = `form_${this.config.formId}`;
  }

  /**
   * Gets the appropriate storage mechanism
   */
  private getStorage(): Storage {
    return this.config.storage === 'localStorage' ? localStorage : sessionStorage;
  }

  /**
   * Creates a form state snapshot
   */
  createSnapshot(formData: Record<string, any>, metadata?: Record<string, any>): FormStateSnapshot {
    const fields: Record<string, any> = {};
    
    // Only include fields that are configured for persistence and not sensitive
    this.config.fields.forEach(fieldConfig => {
      if (fieldConfig.persist && !fieldConfig.sensitive && formData[fieldConfig.name] !== undefined) {
        fields[fieldConfig.name] = formData[fieldConfig.name];
      }
    });

    return {
      formId: this.config.formId,
      fields,
      timestamp: Date.now(),
      url: window.location.href,
      metadata
    };
  }

  /**
   * Saves form state to storage
   */
  saveFormState(formData: Record<string, any>, metadata?: Record<string, any>): boolean {
    try {
      const snapshot = this.createSnapshot(formData, metadata);
      
      // Don't save if no fields to persist
      if (Object.keys(snapshot.fields).length === 0) {
        return false;
      }

      const storage = this.getStorage();
      storage.setItem(this.storageKey, JSON.stringify(snapshot));
      
      this.config.onSave?.(snapshot);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save form state';
      this.config.onError?.(errorMessage);
      return false;
    }
  }

  /**
   * Loads form state from storage
   */
  loadFormState(): FormStateSnapshot | null {
    try {
      const storage = this.getStorage();
      const stored = storage.getItem(this.storageKey);
      
      if (!stored) return null;
      
      const snapshot: FormStateSnapshot = JSON.parse(stored);
      
      // Check if snapshot is expired
      const maxAge = this.config.maxAge || 24 * 60 * 60 * 1000;
      if (Date.now() - snapshot.timestamp > maxAge) {
        this.clearFormState();
        return null;
      }
      
      // Validate that the snapshot is for the correct form
      if (snapshot.formId !== this.config.formId) {
        return null;
      }
      
      this.config.onRestore?.(snapshot);
      return snapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load form state';
      this.config.onError?.(errorMessage);
      return null;
    }
  }

  /**
   * Restores form state to form fields
   */
  restoreFormState(): Record<string, any> | null {
    const snapshot = this.loadFormState();
    if (!snapshot) return null;
    
    return snapshot.fields;
  }

  /**
   * Clears form state from storage
   */
  clearFormState(): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(this.storageKey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear form state';
      this.config.onError?.(errorMessage);
    }
  }

  /**
   * Auto-saves form state with debouncing
   */
  autoSaveFormState(formData: Record<string, any>, metadata?: Record<string, any>): void {
    if (!this.config.autoSave) return;
    
    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    // Set new timeout for debounced save
    this.autoSaveTimeout = setTimeout(() => {
      this.saveFormState(formData, metadata);
    }, this.config.autoSaveDelay);
  }

  /**
   * Checks if form state exists
   */
  hasFormState(): boolean {
    return this.loadFormState() !== null;
  }

  /**
   * Gets form state metadata
   */
  getFormStateMetadata(): { timestamp: number; url: string; metadata?: Record<string, any> } | null {
    const snapshot = this.loadFormState();
    if (!snapshot) return null;
    
    return {
      timestamp: snapshot.timestamp,
      url: snapshot.url,
      metadata: snapshot.metadata
    };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<FormPersistenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Cleanup method to clear timeouts
   */
  cleanup(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }
}

/**
 * Predefined form configurations for common application forms
 */
export const formConfigurations = {
  // Login form - only preserve email, not password
  login: {
    formId: 'login',
    fields: [
      { name: 'email', type: 'email' as const, persist: true },
      { name: 'password', type: 'password' as const, persist: false, sensitive: true }
    ],
    storage: 'localStorage' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // Signup form - preserve non-sensitive fields
  signup: {
    formId: 'signup',
    fields: [
      { name: 'name', type: 'text' as const, persist: true },
      { name: 'email', type: 'email' as const, persist: true },
      { name: 'password', type: 'password' as const, persist: false, sensitive: true }
    ],
    storage: 'localStorage' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // Contact form - preserve all fields
  contact: {
    formId: 'contact',
    fields: [
      { name: 'name', type: 'text' as const, persist: true },
      { name: 'email', type: 'email' as const, persist: true },
      { name: 'message', type: 'textarea' as const, persist: true }
    ],
    storage: 'sessionStorage' as const,
    maxAge: 60 * 60 * 1000 // 1 hour
  },

  // Forgot password form - preserve email
  forgotPassword: {
    formId: 'forgotPassword',
    fields: [
      { name: 'email', type: 'email' as const, persist: true }
    ],
    storage: 'sessionStorage' as const,
    maxAge: 30 * 60 * 1000 // 30 minutes
  },

  // Quiz settings - preserve preferences
  quizSettings: {
    formId: 'quizSettings',
    fields: [
      { name: 'subject', type: 'select' as const, persist: true },
      { name: 'examType', type: 'select' as const, persist: true },
      { name: 'examYear', type: 'select' as const, persist: true },
      { name: 'timeLimit', type: 'number' as const, persist: true },
      { name: 'questionCount', type: 'number' as const, persist: true }
    ],
    storage: 'localStorage' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  },

  // Import questions form - preserve settings but not file content
  importQuestions: {
    formId: 'importQuestions',
    fields: [
      { name: 'selectedSubject', type: 'select' as const, persist: true },
      { name: 'selectedExamType', type: 'select' as const, persist: true },
      { name: 'selectedExamYear', type: 'text' as const, persist: true },
      { name: 'format', type: 'select' as const, persist: true },
      { name: 'importMode', type: 'select' as const, persist: true }
      // Note: file and textInput are not persisted for security reasons
    ],
    storage: 'sessionStorage' as const,
    maxAge: 60 * 60 * 1000 // 1 hour
  }
};

/**
 * Creates a form state persistence instance for a specific form
 */
export function createFormPersistence(
  formId: keyof typeof formConfigurations,
  customConfig?: Partial<FormPersistenceConfig>
): FormStatePersistence {
  const baseConfig = formConfigurations[formId];
  const config = { ...baseConfig, ...customConfig };
  return new FormStatePersistence(config);
}

/**
 * Global form state manager for managing multiple forms
 */
export class GlobalFormStateManager {
  private formInstances: Map<string, FormStatePersistence> = new Map();

  /**
   * Registers a form for state persistence
   */
  registerForm(config: FormPersistenceConfig): FormStatePersistence {
    const instance = new FormStatePersistence(config);
    this.formInstances.set(config.formId, instance);
    return instance;
  }

  /**
   * Gets a form persistence instance
   */
  getForm(formId: string): FormStatePersistence | null {
    return this.formInstances.get(formId) || null;
  }

  /**
   * Removes a form from management
   */
  unregisterForm(formId: string): void {
    const instance = this.formInstances.get(formId);
    if (instance) {
      instance.cleanup();
      this.formInstances.delete(formId);
    }
  }

  /**
   * Clears all form states
   */
  clearAllFormStates(): void {
    this.formInstances.forEach(instance => {
      instance.clearFormState();
    });
  }

  /**
   * Cleanup all form instances
   */
  cleanup(): void {
    this.formInstances.forEach(instance => {
      instance.cleanup();
    });
    this.formInstances.clear();
  }

  /**
   * Gets all form states for debugging
   */
  getAllFormStates(): Record<string, FormStateSnapshot | null> {
    const states: Record<string, FormStateSnapshot | null> = {};
    this.formInstances.forEach((instance, formId) => {
      states[formId] = instance.loadFormState();
    });
    return states;
  }
}

/**
 * Default global form state manager instance
 */
export const globalFormStateManager = new GlobalFormStateManager();

/**
 * Utility functions for common form operations
 */
export const formStateUtils = {
  /**
   * Clears expired form states from storage
   */
  clearExpiredFormStates(): void {
    try {
      // Clear from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('form_')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const snapshot: FormStateSnapshot = JSON.parse(stored);
              const maxAge = 24 * 60 * 60 * 1000; // 24 hours default
              if (Date.now() - snapshot.timestamp > maxAge) {
                localStorage.removeItem(key);
                i--; // Adjust index since we removed an item
              }
            }
          } catch {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
            i--;
          }
        }
      }

      // Clear from sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('form_')) {
          try {
            const stored = sessionStorage.getItem(key);
            if (stored) {
              const snapshot: FormStateSnapshot = JSON.parse(stored);
              const maxAge = 60 * 60 * 1000; // 1 hour default for session storage
              if (Date.now() - snapshot.timestamp > maxAge) {
                sessionStorage.removeItem(key);
                i--;
              }
            }
          } catch {
            // Invalid JSON, remove it
            sessionStorage.removeItem(key);
            i--;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clear expired form states:', error);
    }
  },

  /**
   * Gets all form states from storage
   */
  getAllStoredFormStates(): Record<string, FormStateSnapshot> {
    const states: Record<string, FormStateSnapshot> = {};
    
    try {
      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('form_')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const snapshot: FormStateSnapshot = JSON.parse(stored);
              states[key] = snapshot;
            }
          } catch {
            // Skip invalid entries
          }
        }
      }

      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('form_')) {
          try {
            const stored = sessionStorage.getItem(key);
            if (stored) {
              const snapshot: FormStateSnapshot = JSON.parse(stored);
              states[key] = snapshot;
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get stored form states:', error);
    }
    
    return states;
  },

  /**
   * Clears all form states from storage
   */
  clearAllFormStates(): void {
    try {
      // Clear from localStorage
      const localKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('form_')) {
          localKeys.push(key);
        }
      }
      localKeys.forEach(key => localStorage.removeItem(key));

      // Clear from sessionStorage
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('form_')) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear all form states:', error);
    }
  }
};

// Initialize cleanup on page load
if (typeof window !== 'undefined') {
  // Clear expired form states on page load
  formStateUtils.clearExpiredFormStates();
  
  // Set up periodic cleanup (every 10 minutes)
  setInterval(() => {
    formStateUtils.clearExpiredFormStates();
  }, 10 * 60 * 1000);
}