# Design Document: Streamline Quiz Navigation

## Overview

This design addresses the user experience issue where users selecting a quiz from the `/subjects` page are forced to re-select their choices on the `/quiz/mode-selection` page. The solution involves creating a smart redirect handler that preserves query parameters from legacy routes and directly navigates users to the unified quiz interface when sufficient configuration is provided.

The key insight is that when users click "Practice" or "Quiz" buttons from the subjects page, they've already made their selections (mode and subject). The system should respect these choices and take them directly to the quiz, bypassing the mode selection wizard.

## Architecture

### Current Flow (Problematic)
```
SubjectsPage → /quiz/practice?subject=X&year=ALL&type=ALL
             ↓
          Navigate (redirect)
             ↓
          /quiz/mode-selection (loses query params)
             ↓
          User re-selects everything
             ↓
          /quiz/unified
```

### New Flow (Streamlined)
```
SubjectsPage → /quiz/practice?subject=X&year=ALL&type=ALL
             ↓
          LegacyQuizRedirect component
             ↓
          Parse query params → Build QuizConfig
             ↓
          /quiz/unified (with config)
```

### Component Hierarchy

```
App.tsx
├── Route: /quiz/practice → LegacyQuizRedirect (mode='practice')
├── Route: /quiz/cbt → LegacyQuizRedirect (mode='exam')
├── Route: /quiz/mode-selection → ModeSelectionPage
└── Route: /quiz/unified → UnifiedQuiz
```

## Components and Interfaces

### 1. LegacyQuizRedirect Component

A new component that handles legacy route redirects with query parameter preservation.

**Location:** `src/components/quiz/LegacyQuizRedirect.tsx`

**Props:**
```typescript
interface LegacyQuizRedirectProps {
  mode: QuizMode; // 'practice' or 'exam'
}
```

**Responsibilities:**
- Parse query parameters from the URL
- Determine exam type from query parameters or subject lookup
- Build a valid QuizConfig object
- Redirect to `/quiz/unified` with the config
- Handle error cases by redirecting to `/quiz/mode-selection`

**Query Parameter Mapping:**
- `subject` → `config.subjectSlug`
- `year` → `config.year` (if not 'ALL')
- `type` → `config.examType` (if provided)

### 2. Updated App.tsx Routes

Replace the simple `<Navigate>` components with the new `LegacyQuizRedirect` component:

```typescript
<Route 
  path="/quiz/practice" 
  element={<LegacyQuizRedirect mode="practice" />} 
/>
<Route 
  path="/quiz/cbt" 
  element={<LegacyQuizRedirect mode="exam" />} 
/>
```

### 3. Query Parameter Parser Utility

**Location:** `src/utils/quiz-navigation.ts`

**Functions:**

```typescript
/**
 * Parse legacy quiz URL query parameters
 */
export function parseLegacyQuizParams(searchParams: URLSearchParams): {
  subject?: string;
  year?: number;
  type?: ExamType;
} {
  const subject = searchParams.get('subject') || undefined;
  const yearParam = searchParams.get('year');
  const typeParam = searchParams.get('type');
  
  const year = yearParam && yearParam !== 'ALL' 
    ? parseInt(yearParam, 10) 
    : undefined;
    
  const type = typeParam && typeParam !== 'ALL' && (typeParam === 'JAMB' || typeParam === 'WAEC')
    ? typeParam as ExamType
    : undefined;
  
  return { subject, year, type };
}

/**
 * Build QuizConfig from legacy parameters
 */
export async function buildQuizConfigFromLegacy(
  mode: QuizMode,
  params: { subject?: string; year?: number; type?: ExamType }
): Promise<QuizConfig | null> {
  // If no subject provided, cannot build config
  if (!params.subject) {
    return null;
  }
  
  // Determine exam type
  let examType: ExamType;
  if (params.type) {
    examType = params.type;
  } else {
    // Look up subject to determine exam type
    try {
      const subject = await subjectService.getSubjectBySlug(params.subject);
      if (!subject) return null;
      
      // If subject supports both, default to JAMB
      examType = subject.exam_type === 'BOTH' ? 'JAMB' : subject.exam_type;
    } catch (error) {
      console.error('Failed to lookup subject:', error);
      return null;
    }
  }
  
  // Build config
  const config: QuizConfig = {
    examType,
    mode,
    selectionMethod: 'subject',
    subjectSlug: params.subject,
    year: params.year
  };
  
  // Validate config
  const validationError = QuizConfigHelpers.validateConfig(config);
  if (validationError) {
    console.error('Invalid config:', validationError);
    return null;
  }
  
  return config;
}
```

## Data Models

### QuizConfig (Existing)

No changes needed to the existing `QuizConfig` interface. The current structure already supports all required parameters:

```typescript
interface QuizConfig {
  examType: ExamType;
  mode: QuizMode;
  selectionMethod: SelectionMethod;
  subjectSlug?: string;
  year?: number;
}
```

### URL Query Parameters

Legacy routes use these query parameters:
- `subject`: Subject slug (e.g., "mathematics", "english")
- `year`: Exam year or "ALL"
- `type`: Exam type ("JAMB", "WAEC", or "ALL")

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Query parameter preservation
*For any* legacy quiz URL with query parameters, navigating to that URL should result in those parameters being used to configure the quiz session
**Validates: Requirements 1.3, 1.5**

### Property 2: Direct navigation with valid parameters
*For any* subject selection from the subjects page, clicking Practice or Quiz should navigate directly to the quiz interface without intermediate steps
**Validates: Requirements 1.1, 1.2**

### Property 3: Fallback to mode selection
*For any* legacy quiz URL without sufficient parameters (missing subject), the system should redirect to the mode selection page
**Validates: Requirements 3.4**

### Property 4: Mode selection availability
*For any* user navigating to `/quiz/mode-selection` directly, the full configuration wizard should be displayed
**Validates: Requirements 2.1, 2.4**

### Property 5: Configuration validation
*For any* quiz configuration built from legacy parameters, the configuration must pass validation before being used
**Validates: Requirements 3.3**

## Error Handling

### Missing Subject Parameter
- **Condition:** Legacy route accessed without `subject` query parameter
- **Action:** Redirect to `/quiz/mode-selection`
- **User Message:** None (silent redirect)

### Invalid Subject Slug
- **Condition:** Subject slug doesn't exist in database
- **Action:** Redirect to `/quiz/mode-selection` with error state
- **User Message:** "Subject not found. Please select a valid subject."

### Subject Lookup Failure
- **Condition:** Database error when looking up subject
- **Action:** Redirect to `/quiz/mode-selection`
- **User Message:** "Unable to load subject information. Please try again."

### Invalid Configuration
- **Condition:** Built configuration fails validation
- **Action:** Redirect to `/quiz/mode-selection`
- **User Message:** "Invalid quiz configuration. Please configure your quiz manually."

### Network Errors
- **Condition:** Network failure during subject lookup
- **Action:** Show loading state, retry once, then redirect to `/quiz/mode-selection`
- **User Message:** "Connection error. Please check your network and try again."

## Testing Strategy

### Unit Tests

1. **Query Parameter Parsing**
   - Test parsing valid subject, year, and type parameters
   - Test handling of "ALL" values
   - Test handling of missing parameters
   - Test handling of invalid parameter formats

2. **Config Building**
   - Test building config with all parameters provided
   - Test building config with minimal parameters (subject only)
   - Test building config with invalid subject slug
   - Test exam type determination from subject lookup
   - Test validation of built configurations

3. **Component Rendering**
   - Test LegacyQuizRedirect renders loading state initially
   - Test redirect to unified quiz with valid config
   - Test redirect to mode selection with invalid params
   - Test error state handling

### Integration Tests

1. **End-to-End Navigation Flow**
   - Test clicking Practice button from subjects page navigates to quiz
   - Test clicking Quiz button from subjects page navigates to quiz
   - Test quiz loads with correct subject and mode
   - Test mode selection page still accessible directly

2. **Error Recovery**
   - Test invalid subject slug redirects to mode selection
   - Test missing parameters redirect to mode selection
   - Test network errors are handled gracefully

### Property-Based Tests

Property-based tests will use the `fast-check` library for TypeScript/React applications. Each test should run a minimum of 100 iterations.

1. **Property 1 Test: Query parameter preservation**
   - Generate random valid subject slugs, years, and exam types
   - Build legacy URL with these parameters
   - Navigate to the URL
   - Verify the quiz loads with matching configuration
   - **Feature: streamline-quiz-navigation, Property 1: Query parameter preservation**

2. **Property 2 Test: Direct navigation**
   - Generate random valid subject slugs
   - Simulate clicking Practice/Quiz buttons
   - Verify navigation goes directly to unified quiz
   - Verify no intermediate mode selection page is shown
   - **Feature: streamline-quiz-navigation, Property 2: Direct navigation with valid parameters**

3. **Property 3 Test: Fallback behavior**
   - Generate random invalid or incomplete parameter combinations
   - Navigate to legacy routes with these parameters
   - Verify redirect to mode selection page occurs
   - **Feature: streamline-quiz-navigation, Property 3: Fallback to mode selection**

4. **Property 5 Test: Configuration validation**
   - Generate random parameter combinations
   - Build configurations from these parameters
   - Verify all built configurations pass validation
   - **Feature: streamline-quiz-navigation, Property 5: Configuration validation**

## Implementation Notes

### Backward Compatibility

The solution maintains full backward compatibility:
- Existing links to `/quiz/practice` and `/quiz/cbt` continue to work
- Mode selection page remains fully functional
- No changes to UnifiedQuiz component required
- No changes to existing quiz configuration types

### Performance Considerations

- Subject lookup adds one database query to the navigation flow
- This is acceptable as it only occurs once per quiz session
- Consider caching subject data in sessionStorage to avoid repeated lookups
- Loading state prevents user confusion during async operations

### Accessibility

- Loading state includes appropriate ARIA labels
- Error messages are announced to screen readers
- Keyboard navigation remains unaffected
- Focus management handled by React Router

### Future Enhancements

1. **Smart Exam Type Detection:** If subject supports both JAMB and WAEC, could show a quick picker instead of defaulting
2. **Recent Subjects:** Cache recently accessed subjects to speed up lookups
3. **Deep Linking:** Support more complex URL patterns for sharing specific quiz configurations
4. **Analytics:** Track how often users use direct navigation vs. mode selection wizard
