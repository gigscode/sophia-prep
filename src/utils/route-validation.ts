/**
 * Route Validation Utilities
 * 
 * Provides validation for route parameters and URL patterns
 * to ensure proper navigation and error handling.
 */

/**
 * Validates a slug parameter (used in subject routes)
 * Slugs should be lowercase, alphanumeric with hyphens
 */
export const validateSlug = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') return false;
  
  // Allow alphanumeric characters, hyphens, and underscores
  // Must start and end with alphanumeric character
  const slugPattern = /^[a-zA-Z0-9]+([a-zA-Z0-9\-_]*[a-zA-Z0-9])?$/;
  return slugPattern.test(slug) && slug.length <= 100;
};

/**
 * Validates a numeric ID parameter
 */
export const validateNumericId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  
  const numericPattern = /^\d+$/;
  return numericPattern.test(id) && parseInt(id, 10) > 0;
};

/**
 * Validates quiz mode parameter
 */
export const validateQuizMode = (mode: string): boolean => {
  if (!mode || typeof mode !== 'string') return false;
  
  const validModes = ['practice', 'exam', 'timed', 'untimed'];
  return validModes.includes(mode.toLowerCase());
};

/**
 * Validates class category parameter
 */
export const validateClassCategory = (category: string): boolean => {
  if (!category || typeof category !== 'string') return false;
  
  const validCategories = ['primary', 'secondary', 'tertiary', 'jamb', 'waec', 'neco'];
  return validCategories.includes(category.toLowerCase());
};

/**
 * Validates subject combination parameter
 */
export const validateSubjectCombination = (combination: string): boolean => {
  if (!combination || typeof combination !== 'string') return false;
  
  // Subject combinations are comma-separated subject slugs
  const subjects = combination.split(',');
  return subjects.length > 0 && subjects.length <= 4 && 
         subjects.every(subject => validateSlug(subject.trim()));
};

/**
 * Validates query parameters for quiz routes
 */
export const validateQuizParams = (params: URLSearchParams): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate subject parameter
  const subject = params.get('subject');
  if (subject && !validateSlug(subject)) {
    errors.push('Invalid subject parameter');
  }
  
  // Validate mode parameter
  const mode = params.get('mode');
  if (mode && !validateQuizMode(mode)) {
    errors.push('Invalid quiz mode parameter');
  }
  
  // Validate category parameter
  const category = params.get('category');
  if (category && !validateClassCategory(category)) {
    errors.push('Invalid class category parameter');
  }
  
  // Validate time limit parameter
  const timeLimit = params.get('timeLimit');
  if (timeLimit && (!validateNumericId(timeLimit) || parseInt(timeLimit, 10) > 300)) {
    errors.push('Invalid time limit parameter');
  }
  
  // Validate question count parameter
  const questionCount = params.get('questionCount');
  if (questionCount && (!validateNumericId(questionCount) || parseInt(questionCount, 10) > 100)) {
    errors.push('Invalid question count parameter');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes a route parameter by removing potentially harmful characters
 */
export const sanitizeRouteParam = (param: string): string => {
  if (!param || typeof param !== 'string') return '';
  
  // Remove potentially harmful characters but preserve valid URL characters
  return param
    .replace(/[<>\"']/g, '') // Remove HTML/script injection characters
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .trim()
    .substring(0, 200); // Limit length
};

/**
 * Validates and sanitizes all parameters in a URL
 */
export const validateAndSanitizeUrl = (url: string): { isValid: boolean; sanitizedUrl: string; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Validate protocol is safe
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      errors.push('Invalid URL protocol');
    }
    
    // Validate pathname doesn't contain suspicious patterns
    if (urlObj.pathname.includes('..') || urlObj.pathname.includes('<') || urlObj.pathname.includes('>')) {
      errors.push('Invalid characters in URL path');
    }
    
    // Sanitize query parameters
    const sanitizedParams = new URLSearchParams();
    urlObj.searchParams.forEach((value, key) => {
      const sanitizedKey = sanitizeRouteParam(key);
      const sanitizedValue = sanitizeRouteParam(value);
      if (sanitizedKey && sanitizedValue) {
        sanitizedParams.set(sanitizedKey, sanitizedValue);
      }
    });
    
    // Reconstruct URL with sanitized parameters
    const sanitizedUrl = urlObj.pathname + (sanitizedParams.toString() ? '?' + sanitizedParams.toString() : '');
    
    return {
      isValid: errors.length === 0,
      sanitizedUrl,
      errors
    };
  } catch (error) {
    errors.push('Malformed URL');
    return {
      isValid: false,
      sanitizedUrl: '/',
      errors
    };
  }
};

/**
 * Route parameter validation configuration
 */
export interface RouteParamConfig {
  name: string;
  validator: (value: string) => boolean;
  required?: boolean;
  errorMessage?: string;
}

/**
 * Validates multiple route parameters based on configuration
 */
export const validateRouteParams = (
  params: Record<string, string | undefined>,
  config: RouteParamConfig[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const paramConfig of config) {
    const value = params[paramConfig.name];
    
    // Check if required parameter is missing
    if (paramConfig.required && (!value || value.trim() === '')) {
      errors.push(paramConfig.errorMessage || `Missing required parameter: ${paramConfig.name}`);
      continue;
    }
    
    // Validate parameter if present
    if (value && !paramConfig.validator(value)) {
      errors.push(paramConfig.errorMessage || `Invalid parameter: ${paramConfig.name}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};