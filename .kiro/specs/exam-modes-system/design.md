# Design Document

## Overview

The exam modes system extends the existing quiz infrastructure to support eight distinct quiz modes combining exam type (WAEC/JAMB), mode (Practice/Exam Simulation), and selection method (Subject/Year). The system provides a unified interface for students to practice with immediate feedback or simulate real exam conditions with timed sessions and delayed explanations.

The design leverages the existing question database schema (which already includes `exam_type` and `exam_year` fields), quiz components (`CBTQuiz.tsx`, `PracticeModeQuiz.tsx`), and services (`questionService`, `quizService`, `analyticsService`). The primary changes involve:

1. Creating a unified mode selection flow
2. Implementing configurable timer system
3. Conditionally showing/hiding explanations based on mode
4. Enhancing quiz attempt tracking with mode-specific metadata

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Quiz Entry Point                      │
│              (Unified Mode Selection)                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐       ┌───────▼────────┐
│  Practice Mode │       │  Exam Simulation│
│   Component    │       │    Component    │
└───────┬────────┘       └───────┬────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Quiz Engine Core      │
        │  - Question Display     │
        │  - Answer Recording     │
        │  - Navigation           │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Supporting Services   │
        │  - questionService      │
        │  - timerService         │
        │  - analyticsService     │
        └─────────────────────────┘
```

### Data Flow

1. **Mode Selection**: User selects exam type → mode (practice/exam) → selection method (subject/year) → specific subject or year
2. **Question Loading**: System queries questions filtered by exam_type, exam_year (if applicable), and subject
3. **Quiz Execution**: Questions displayed with mode-specific behavior (timer, explanation visibility)
4. **Completion**: Results saved with full attempt metadata, then displayed with explanations

## Components and Interfaces

### 1. Mode Selection Component

**Purpose**: Unified entry point for all quiz modes

**Interface**:
```typescript
interface ModeSelectionProps {
  onModeSelected: (config: QuizConfig) => void;
}

interface QuizConfig {
  examType: 'JAMB' | 'WAEC';
  mode: 'practice' | 'exam';
  selectionMethod: 'subject' | 'year';
  subjectSlug?: string;
  year?: number;
}
```

**Behavior**:
- Step 1: Select exam type (WAEC/JAMB)
- Step 2: Select mode (Practice/Exam Simulation)
- Step 3: Select method (Subject/Year)
- Step 4: Select specific subject or year
- Navigate to appropriate quiz component with configuration

### 2. Unified Quiz Component

**Purpose**: Single component handling both practice and exam modes

**Interface**:
```typescript
interface UnifiedQuizProps {
  config: QuizConfig;
}

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  timeRemaining: number | null; // null for practice mode
  showExplanations: boolean;
  completed: boolean;
}
```

**Key Features**:
- Conditional timer display based on mode
- Conditional explanation visibility
- Auto-submit on timer expiration (exam mode only)
- Manual submit always available (practice mode) or disabled (exam mode)

### 3. Timer Service

**Purpose**: Manage exam timing and auto-submission

**Interface**:
```typescript
interface TimerConfig {
  examType: 'JAMB' | 'WAEC';
  subject?: string;
  year?: number;
}

interface TimerService {
  getDuration(config: TimerConfig): number; // returns seconds
  startTimer(duration: number, onTick: (remaining: number) => void, onExpire: () => void): TimerHandle;
  stopTimer(handle: TimerHandle): void;
}

interface TimerHandle {
  id: string;
  pause(): void;
  resume(): void;
  getRemaining(): number;
}
```

**Timer Configuration Storage**:
```typescript
interface TimerConfigEntry {
  id: string;
  exam_type: 'JAMB' | 'WAEC';
  subject_slug?: string;
  year?: number;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}
```

**Default Durations**:
- JAMB (all subjects): 2100 seconds (35 minutes per subject, 4 subjects = 140 minutes total, but per-subject is 35 min)
- WAEC (varies by subject): Default 3600 seconds (60 minutes), configurable per subject
- Past year papers: Use year-specific duration if available, otherwise default

### 4. Enhanced Analytics Service

**Purpose**: Track quiz attempts with mode-specific metadata

**Interface**:
```typescript
interface QuizAttempt {
  id: string;
  user_id: string;
  subject_id?: string;
  quiz_mode: 'practice' | 'cbt' | 'practice-subject' | 'practice-year' | 'exam-subject' | 'exam-year';
  exam_type?: 'JAMB' | 'WAEC';
  exam_year?: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  completed_at: string;
  questions_data: QuestionAttemptData[];
}

interface QuestionAttemptData {
  question_id: string;
  user_answer?: string;
  correct_answer?: string;
  is_correct: boolean;
  time_spent_seconds?: number;
}
```

## Data Models

### Existing Database Schema (No Changes Required)

The current `questions` table already supports the required fields:

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  topic_id UUID REFERENCES topics(id),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  exam_year INTEGER,           -- Already exists
  exam_type VARCHAR(10),        -- Already exists ('JAMB' or 'WAEC')
  question_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### New Timer Configuration Table

```sql
CREATE TABLE timer_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_type VARCHAR(10) NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  subject_slug VARCHAR(100),
  year INTEGER,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_type, subject_slug, year)
);

-- Default configurations
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds) VALUES
  ('JAMB', NULL, NULL, 2100),  -- 35 minutes default for JAMB
  ('WAEC', NULL, NULL, 3600);  -- 60 minutes default for WAEC
```

### Enhanced Quiz Attempts Table

```sql
-- Add new columns to existing quiz_attempts table
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS quiz_mode VARCHAR(50);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS exam_type VARCHAR(10);
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS exam_year INTEGER;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Exam type selection loads filtered subjects

*For any* exam type selection (WAEC or JAMB), all loaded subjects should have an exam_type field matching the selected type.

**Validates: Requirements 1.2**

### Property 2: Exam type change resets selections

*For any* quiz configuration state with subject and year selections, changing the exam type should reset both subject and year to their default (unselected) values.

**Validates: Requirements 1.3**

### Property 3: Practice mode configuration

*For any* quiz session configured as practice mode, the timer should be null and explanation visibility should be enabled immediately after answering.

**Validates: Requirements 2.2**

### Property 4: Exam simulation mode configuration

*For any* quiz session configured as exam simulation mode, the timer should be set to a positive duration and explanation visibility should be disabled until completion.

**Validates: Requirements 2.3**

### Property 5: Subject filtering

*For any* selected subject, all loaded questions should have a topic_id that belongs to that subject.

**Validates: Requirements 3.2**

### Property 6: Subject and year filtering

*For any* selected subject and year combination, all loaded questions should match both the subject (via topic_id) and have an exam_year matching the selected year.

**Validates: Requirements 3.3**

### Property 7: Year filtering

*For any* selected year, all loaded questions should have an exam_year field equal to that year.

**Validates: Requirements 4.2**

### Property 8: Year-based exam timer configuration

*For any* year-based exam simulation, the timer duration should match the configured duration for that specific year and exam type combination.

**Validates: Requirements 4.3**

### Property 9: Practice mode feedback visibility

*For any* question answered in practice mode, the system should display correctness feedback (correct/incorrect indicator) immediately.

**Validates: Requirements 5.1**

### Property 10: Practice mode explanation visibility

*For any* question answered in practice mode, the explanation should be visible immediately after answering.

**Validates: Requirements 5.2**

### Property 11: Practice mode navigation control

*For any* practice mode state where an explanation is displayed, a next question control should be enabled and visible.

**Validates: Requirements 5.3**

### Property 12: Practice mode manual submission

*For any* point in time during a practice mode session, the manual submit control should be enabled.

**Validates: Requirements 5.4**

### Property 13: Timer configuration lookup

*For any* exam simulation configuration (exam type, subject, year), querying the timer service should return a positive integer duration in seconds.

**Validates: Requirements 6.1**

### Property 14: Exam mode submit prevention

*For any* active exam simulation with time remaining, the manual submit control should be disabled.

**Validates: Requirements 6.4, 11.1**

### Property 15: Exam mode feedback suppression

*For any* question answered in exam simulation mode while the timer is active, no correctness feedback should be displayed.

**Validates: Requirements 7.1**

### Property 16: Exam mode explanation suppression

*For any* question answered in exam simulation mode while the timer is active, explanations should not be visible.

**Validates: Requirements 7.2**

### Property 17: Post-completion explanation visibility

*For any* completed exam simulation, all questions should have their explanations visible in the review interface.

**Validates: Requirements 7.3, 7.4**

### Property 18: Quiz attempt persistence

*For any* completed quiz session, a quiz attempt record should be created in the database containing exam_type, subject_id (if applicable), exam_year (if applicable), score, and timestamp.

**Validates: Requirements 8.1**

### Property 19: Question response persistence

*For any* completed quiz session, all question responses should be stored with question_id, user_answer, correct_answer, and is_correct fields.

**Validates: Requirements 8.2**

### Property 20: Immediate persistence

*For any* quiz attempt creation, the record should be immediately queryable from the database without requiring additional actions.

**Validates: Requirements 8.3**

### Property 21: Attempt history retrieval

*For any* user, querying quiz attempt history should return all past attempts for that user ordered by completion time.

**Validates: Requirements 8.4**

### Property 22: Timer configuration fallback

*For any* timer configuration query where no specific match exists (exam type + subject + year), the system should return a default duration for that exam type.

**Validates: Requirements 9.3**

### Property 23: Timer configuration hot-reload

*For any* timer configuration update, subsequent quiz sessions should use the updated duration without requiring application restart.

**Validates: Requirements 9.4**

### Property 24: Mode label consistency

*For any* quiz session, the mode label displayed in the results screen should match the mode label used during mode selection.

**Validates: Requirements 10.3**

### Property 25: Question import with exam metadata

*For any* question imported with exam_type and exam_year fields, those values should be stored and queryable.

**Validates: Requirements 12.1, 12.2**

### Property 26: Question import without exam metadata

*For any* question imported without exam_type or exam_year fields, those fields should be stored as null and the question should still be valid.

**Validates: Requirements 12.3**

### Property 27: Question query filtering

*For any* question query with exam_type and exam_year filters, all returned questions should match both filter criteria.

**Validates: Requirements 12.4**

## Error Handling

### Timer Errors

- **Timer configuration not found**: Fall back to default duration for exam type
- **Timer service failure**: Log error, disable auto-submit, allow manual submission
- **Timer desynchronization**: Persist timer state to localStorage, restore on page reload

### Question Loading Errors

- **No questions available**: Display friendly message, offer to change filters or return to selection
- **Network failure**: Retry with exponential backoff, cache questions in localStorage for offline access
- **Invalid question data**: Skip malformed questions, log errors, continue with valid questions

### Submission Errors

- **Network failure during submission**: Queue attempt in localStorage, retry on reconnection
- **Partial data loss**: Validate all required fields before submission, prompt user if data missing
- **Database constraint violations**: Log error, retry with sanitized data

### State Management Errors

- **Browser refresh during quiz**: Restore quiz state from localStorage if available
- **Concurrent sessions**: Warn user if multiple tabs detected, offer to resume or start fresh
- **Invalid state transitions**: Reset to safe state, log error for debugging

## Testing Strategy

### Unit Testing

The system will use **Vitest** (already configured in the project) for unit testing. Unit tests will cover:

- Timer service functions (start, stop, pause, resume, getDuration)
- Question filtering logic (by subject, year, exam type)
- Quiz state management (answer recording, navigation, completion)
- Data transformation functions (normalizeQuestions, formatAttemptData)
- Error handling edge cases (network failures, invalid data)

### Property-Based Testing

The system will use **fast-check** (already available in package.json) for property-based testing. Each correctness property listed above will be implemented as a property-based test.

**Property-based testing requirements**:
- Each property test should run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design document property
- Tag format: `// Feature: exam-modes-system, Property {number}: {property_text}`
- Generators should produce realistic test data (valid exam types, years, subjects, questions)

**Example property test structure**:
```typescript
// Feature: exam-modes-system, Property 5: Subject filtering
test('all loaded questions belong to selected subject', () => {
  fc.assert(
    fc.property(
      fc.record({
        subjectId: fc.uuid(),
        examType: fc.constantFrom('JAMB', 'WAEC'),
        topicIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 })
      }),
      async ({ subjectId, examType, topicIds }) => {
        // Generate questions with topic_ids from the subject
        const questions = await loadQuestionsForSubject(subjectId, examType);
        
        // Verify all questions have topic_id in the subject's topic list
        questions.forEach(q => {
          expect(topicIds).toContain(q.topic_id);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

- Test complete quiz flows from mode selection to results
- Test timer behavior across page refreshes
- Test quiz attempt persistence and retrieval
- Test admin question import with various metadata combinations

### Manual Testing Checklist

- Verify all 8 mode combinations work correctly
- Test timer accuracy and auto-submit behavior
- Verify explanation visibility in each mode
- Test quiz state persistence across browser refresh
- Verify analytics data accuracy

## Implementation Notes

### Reusing Existing Components

The current codebase has two quiz components:
- `CBTQuiz.tsx`: Timed quiz with results at end
- `PracticeModeQuiz.tsx`: Untimed quiz with immediate feedback

**Recommendation**: Create a new `UnifiedQuiz.tsx` component that consolidates both patterns with mode-based conditional rendering. This reduces code duplication and makes mode-specific behavior explicit.

### Timer Implementation

Use browser's `setInterval` for countdown with localStorage backup:
```typescript
const startTimer = (duration: number, onTick: (remaining: number) => void, onExpire: () => void) => {
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  // Persist to localStorage
  localStorage.setItem('quiz_timer_end', endTime.toString());
  
  const interval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    
    onTick(remaining);
    
    if (remaining === 0) {
      clearInterval(interval);
      localStorage.removeItem('quiz_timer_end');
      onExpire();
    }
  }, 1000);
  
  return { id: interval, pause: () => {}, resume: () => {}, getRemaining: () => Math.floor((endTime - Date.now()) / 1000) };
};
```

### Question Filtering Strategy

Leverage existing `questionService.getQuestionsBySubjectSlug()` which already supports `exam_year` and `exam_type` filters. No changes needed to the service layer.

### Mode Selection Flow

Implement as a multi-step wizard:
1. Exam type selection (WAEC/JAMB) - full-screen cards
2. Mode selection (Practice/Exam) - full-screen cards
3. Method selection (Subject/Year) - tabs or toggle
4. Specific selection (dropdown or list) - form
5. Start quiz button - navigates to UnifiedQuiz component

### Analytics Enhancement

Extend existing `analyticsService.saveQuizAttempt()` to accept additional fields:
- `quiz_mode`: String enum ('practice-subject', 'practice-year', 'exam-subject', 'exam-year')
- `exam_type`: 'JAMB' | 'WAEC' | null
- `exam_year`: number | null

No database migration needed if columns already exist (check with ALTER TABLE IF NOT EXISTS).

## Performance Considerations

- **Question Loading**: Limit queries to 60 questions max to prevent memory issues
- **Timer Updates**: Use 1-second intervals (not milliseconds) to reduce CPU usage
- **State Persistence**: Debounce localStorage writes to avoid excessive I/O
- **Component Rendering**: Use React.memo for question cards to prevent unnecessary re-renders

## Security Considerations

- **Timer Manipulation**: Validate submission timestamp on server-side
- **Answer Tampering**: Store answers in encrypted localStorage or session storage
- **Attempt Forgery**: Verify user authentication before saving attempts
- **SQL Injection**: Use parameterized queries for all database operations (already handled by Supabase client)

## Accessibility

- **Keyboard Navigation**: Support arrow keys for question navigation, Enter for submit
- **Screen Readers**: Announce timer updates, question changes, and feedback
- **Focus Management**: Maintain focus on current question, move to feedback after answering
- **Color Contrast**: Ensure timer warnings (red for low time) meet WCAG AA standards
- **ARIA Labels**: Add appropriate labels for mode selection, timer, and quiz controls
