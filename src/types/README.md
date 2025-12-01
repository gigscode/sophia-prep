# Quiz Configuration Types

This directory contains the unified type definitions for the exam modes system.

## Overview

The quiz configuration types provide a consistent interface for configuring and managing quiz sessions across different exam types (WAEC/JAMB), modes (practice/exam), and selection methods (subject/year).

## Core Types

### `QuizConfig`

The main configuration interface that defines all parameters for a quiz session:

```typescript
interface QuizConfig {
  examType: ExamType;           // 'JAMB' | 'WAEC'
  mode: QuizMode;                // 'practice' | 'exam'
  selectionMethod: SelectionMethod; // 'subject' | 'year'
  subjectSlug?: string;          // Required for subject-based quizzes
  year?: number;                 // Required for year-based quizzes
}
```

### `QuizState`

Tracks the current state of an active quiz session:

```typescript
interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  timeRemaining: number | null;
  showExplanations: boolean;
  completed: boolean;
  timerHandle: TimerHandle | null;
  startTime: number;
  config: QuizConfig;
}
```

### `QuizQuestion`

Normalized format for quiz questions:

```typescript
interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correct?: string;
  explanation?: string;
  examYear?: number;
  examType?: ExamType;
}
```

## Helper Functions

The `QuizConfigHelpers` object provides utility functions for working with quiz configurations:

### Mode Detection

```typescript
QuizConfigHelpers.isPracticeMode(config)  // Returns true if practice mode
QuizConfigHelpers.isExamMode(config)      // Returns true if exam mode
QuizConfigHelpers.isSubjectBased(config)  // Returns true if subject-based
QuizConfigHelpers.isYearBased(config)     // Returns true if year-based
```

### Label Generation

```typescript
QuizConfigHelpers.getModeLabel('practice')        // Returns "Practice"
QuizConfigHelpers.getExamTypeLabel('JAMB')        // Returns "JAMB"
QuizConfigHelpers.getQuizModeIdentifier(config)   // Returns "practice-subject"
```

### State Management

```typescript
// Create initial state from configuration
const initialState = QuizConfigHelpers.createInitialState(config);
```

### Validation

```typescript
// Validate configuration (returns null if valid, error message if invalid)
const error = QuizConfigHelpers.validateConfig(config);
if (error) {
  console.error(error);
}
```

### Factory Methods

```typescript
// Create practice mode configuration
const practiceConfig = QuizConfigHelpers.createPracticeConfig(
  'JAMB',
  'subject',
  { subjectSlug: 'mathematics' }
);

// Create exam mode configuration
const examConfig = QuizConfigHelpers.createExamConfig(
  'WAEC',
  'year',
  { year: 2023 }
);
```

## Usage Examples

### Creating a Practice Mode Quiz

```typescript
import { QuizConfigHelpers } from '@/types';

// Create configuration
const config = QuizConfigHelpers.createPracticeConfig(
  'JAMB',
  'subject',
  { subjectSlug: 'english' }
);

// Validate configuration
const error = QuizConfigHelpers.validateConfig(config);
if (error) {
  throw new Error(error);
}

// Create initial state
const state = QuizConfigHelpers.createInitialState(config);
```

### Creating an Exam Simulation

```typescript
import { QuizConfigHelpers } from '@/types';

// Create configuration
const config = QuizConfigHelpers.createExamConfig(
  'WAEC',
  'year',
  { year: 2023 }
);

// Get mode identifier for analytics
const modeId = QuizConfigHelpers.getQuizModeIdentifier(config);
// Returns: "exam-year"
```

### Checking Quiz Mode

```typescript
import { QuizConfigHelpers } from '@/types';

if (QuizConfigHelpers.isPracticeMode(config)) {
  // Show explanations immediately
  showExplanations = true;
} else {
  // Hide explanations until completion
  showExplanations = false;
}
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 1.1**: Exam type selection (WAEC/JAMB)
- **Requirement 2.1**: Mode selection (practice/exam)
- **Requirement 2.2**: Practice mode configuration
- **Requirement 2.3**: Exam simulation mode configuration

## Testing

Unit tests are provided in `quiz-config.test.ts` covering:

- Mode detection
- Selection method detection
- Label generation
- Initial state creation
- Configuration validation
- Factory methods

Run tests with:

```bash
npm test src/types/quiz-config.test.ts
```
