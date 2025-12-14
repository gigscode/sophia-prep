# Migration Guide: New Database Schema Implementation

## Overview
This guide helps you migrate from the old database structure to the new normalized schema with separate tables for exam types, subject categories, and improved question management.

## Key Changes

### 1. Database Structure Changes
- **New Tables**: `exam_types`, `subject_categories`, `subject_exam_types`, `quiz_mode_configs`, `cbt_exam_configs`
- **Updated Tables**: `subjects_new`, `questions_new`, `quiz_attempts_new`
- **Removed Dependencies**: No more topics table, direct subject-question relationship

### 2. New Services Available
- `ExamTypeService` - Manage exam types (JAMB, WAEC, etc.)
- `SubjectCategoryService` - Manage subject categories (Science, Arts, etc.)
- `UpdatedSubjectService` - Enhanced subject operations with relations
- `UpdatedQuestionService` - Optimized question queries with new structure
- `QuestionUploadService` - Bulk question upload with validation

## Migration Steps

### Step 1: Update Type Imports
```typescript
// Old imports
import type { ExamType, QuizMode } from '../types/quiz-config';

// New imports
import type { 
  ExamType, 
  QuizMode, 
  SubjectWithDetails,
  CBTQuestionResponse,
  PracticeQuestionResponse 
} from '../types/database';
```

### Step 2: Update Subject Service Usage

#### Old Way:
```typescript
import { subjectService } from '../services/subject-service';

// Get subjects by exam type
const subjects = await subjectService.getSubjectsByExamType('JAMB');
```

#### New Way:
```typescript
import { updatedSubjectService } from '../services/updated-subject-service';

// Get subjects with full details including categories and exam types
const subjects = await updatedSubjectService.getSubjectsByExamType('jamb');

// Validate JAMB subject selection (English + 3 others)
const validation = await updatedSubjectService.validateJAMBSubjects(selectedIds);
```

### Step 3: Update Question Service Usage

#### Old Way:
```typescript
import { questionService } from '../services/question-service';

// Get questions by subject
const questions = await questionService.getQuestionsBySubjectSlug('mathematics', {
  exam_type: 'JAMB',
  limit: 20
});
```

#### New Way:
```typescript
import { updatedQuestionService } from '../services/updated-question-service';

// Practice mode - questions from any exam type
const practiceQuestions = await updatedQuestionService.getPracticeQuestions(
  [subjectId1, subjectId2],
  { limit: 20, difficulty: 'MEDIUM' }
);

// CBT mode - questions from specific exam type only
const cbtQuestions = await updatedQuestionService.getCBTExamQuestions(
  'jamb',
  [subjectId1, subjectId2, subjectId3, subjectId4],
  { limit: 180 }
);

// JAMB CBT with 4-subject validation
const jambQuestions = await updatedQuestionService.getJAMBCBTQuestions(
  [englishId, mathId, physicsId, chemistryId],
  { questionsPerSubject: 45 }
);
```

### Step 4: Update Quiz Configuration

#### Old Quiz Config:
```typescript
const config: QuizConfig = {
  examType: 'JAMB',
  mode: 'exam',
  selectionMethod: 'subject',
  subjectSlug: 'mathematics'
};
```

#### New Quiz Config:
```typescript
// For Practice Mode
const practiceConfig = {
  mode: 'PRACTICE',
  subjectIds: [mathId, physicsId],
  difficulty: 'MEDIUM',
  limit: 20
};

// For CBT Exam Mode
const cbtConfig = {
  mode: 'CBT_EXAM',
  examTypeSlug: 'jamb',
  subjectIds: [englishId, mathId, physicsId, chemistryId],
  questionsRequested: 180
};
```

### Step 5: Update Question Upload Logic

#### New Question Upload:
```typescript
import { questionUploadService } from '../services/question-upload-service';

// Single question upload
const result = await questionUploadService.uploadQuestion({
  subjectSlug: 'mathematics',
  examTypeSlug: 'jamb',
  questionText: 'What is 2 + 2?',
  optionA: '3',
  optionB: '4',
  optionC: '5',
  optionD: '6',
  correctAnswer: 'B',
  explanation: '2 + 2 equals 4',
  difficultyLevel: 'EASY',
  examYear: 2024
});

// Bulk upload from JSON
const bulkResult = await questionUploadService.uploadQuestionsFromJSON(jsonData);
```

## Component Updates Needed

### 1. Subject Selection Components
- Update to use `updatedSubjectService.getAllSubjectsWithDetails()`
- Show subject categories and exam types
- Implement JAMB 4-subject validation

### 2. Quiz Setup Components
- Add exam type selection
- Add quiz mode selection (Practice vs CBT)
- Add custom question count for CBT mode
- Validate subject combinations before starting quiz

### 3. Question Display Components
- Update question data structure
- Handle new response formats from database functions
- Show subject information for multi-subject quizzes

### 4. Admin Components
- Update question upload forms
- Add exam type and category management
- Show upload statistics and validation results

## Database Functions Available

### Practice Mode:
```sql
SELECT * FROM get_practice_questions(
  ARRAY['subject-id-1', 'subject-id-2']::UUID[],
  20,  -- limit
  'MEDIUM'  -- difficulty
);
```

### CBT Exam Mode:
```sql
SELECT * FROM get_cbt_exam_questions_with_validation(
  'jamb',  -- exam type slug
  ARRAY['subject-id-1', 'subject-id-2']::UUID[],
  180  -- requested questions
);
```

### JAMB Validation:
```sql
SELECT * FROM validate_jamb_subject_selection(
  ARRAY['english-id', 'math-id', 'physics-id', 'chemistry-id']::UUID[]
);
```

## Testing the Migration

### 1. Test Subject Loading
```typescript
// Test new subject service
const subjects = await updatedSubjectService.getAllSubjectsWithDetails();
console.log('Subjects with details:', subjects);

// Test JAMB subjects
const jambSubjects = await updatedSubjectService.getJAMBSubjects();
console.log('JAMB subjects:', jambSubjects);
```

### 2. Test Question Loading
```typescript
// Test practice questions
const practiceQuestions = await updatedQuestionService.getPracticeQuestions(
  ['subject-id'],
  { limit: 5 }
);
console.log('Practice questions:', practiceQuestions);
```

### 3. Test JAMB Validation
```typescript
// Test with valid combination (English + 3 others)
const validation = await updatedSubjectService.validateJAMBSubjects([
  'english-id', 'math-id', 'physics-id', 'chemistry-id'
]);
console.log('Validation result:', validation);
```

## Rollback Plan

If issues occur, you can:
1. Keep old services alongside new ones
2. Use feature flags to switch between old/new implementations
3. The old tables (`subjects`, `questions`) still exist for fallback

## Next Steps

1. **Update Components**: Start with subject selection components
2. **Test Thoroughly**: Test both practice and CBT modes
3. **Migrate Data**: Use the migration queries in the SQL file
4. **Update Admin Panel**: Add new question upload functionality
5. **Monitor Performance**: Check query performance with new structure

## Benefits After Migration

- ✅ Proper JAMB 4-subject validation
- ✅ Flexible exam type and category management
- ✅ Better question organization and filtering
- ✅ Improved quiz mode separation (Practice vs CBT)
- ✅ Custom question counts for CBT exams
- ✅ Better data integrity and normalization
- ✅ Easier maintenance and feature additions