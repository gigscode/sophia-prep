# Design Document: Remove Topic Dependency from Quiz System

## Overview

This design document outlines the approach for removing the mandatory topic dependency from the Sophia Prep quiz system. Currently, questions require a `topic_id` foreign key, creating an unnecessary intermediary layer between subjects and questions. This design simplifies the architecture by making topics optional and adding a direct `subject_id` column to the questions table, allowing questions to be queried directly by subject without requiring topic categorization.

The key changes include:
1. Adding a `subject_id` column to the questions table
2. Making `topic_id` nullable
3. Updating the Question Service to query by subject_id directly
4. Maintaining backward compatibility with existing topic-based questions
5. Updating the quiz flow to work without topic selection

## Architecture

### Current Architecture
```
Subject → Topic (required) → Question
```

### New Architecture
```
Subject → Question (direct)
Subject → Topic (optional) → Question (backward compatible)
```

### Database Schema Changes

The questions table will be modified to support both direct subject association and optional topic categorization:

```sql
-- Add subject_id column to questions table
ALTER TABLE questions 
ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;

-- Make topic_id nullable
ALTER TABLE questions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Backfill subject_id from existing topic relationships
UPDATE questions q
SET subject_id = t.subject_id
FROM topics t
WHERE q.topic_id = t.id;

-- Create index for performance
CREATE INDEX idx_questions_subject_id ON questions(subject_id);

-- Update foreign key constraint for topic_id
ALTER TABLE questions
DROP CONSTRAINT questions_topic_id_fkey,
ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES topics(id) 
  ON DELETE SET NULL;
```

## Components and Interfaces

### 1. Question Service Updates

The `QuestionService` class will be updated to support direct subject-based queries:

**Current Implementation:**
- Queries subject → gets topics → queries questions by topic_ids
- Requires topics to exist for any questions to be returned

**New Implementation:**
- Primary query path: subject_id directly
- Fallback query path: topic_id (for backward compatibility)
- Combined filtering at database level

**Updated Method Signatures:**

```typescript
class QuestionService {
  // Updated to query by subject_id directly
  async getQuestionsBySubjectSlug(
    slug: string, 
    filters?: { 
      exam_year?: number; 
      exam_type?: 'JAMB' | 'WAEC'; 
      limit?: number 
    }
  ): Promise<Question[]>

  // New method for direct subject_id queries
  async getQuestionsBySubjectId(
    subjectId: string,
    filters?: {
      exam_year?: number;
      exam_type?: 'JAMB' | 'WAEC';
      limit?: number;
    }
  ): Promise<Question[]>

  // Existing methods remain unchanged
  async getQuestionsByYear(year: number, filters?: {...}): Promise<Question[]>
  async getQuestionsByFilters(filters: {...}): Promise<Question[]>
  async getQuestionsByTopic(topicId: string, filters?: {...}): Promise<Question[]>
}
```

### 2. UnifiedQuiz Component

The `UnifiedQuiz` component will continue to work without changes, as it already uses the Question Service abstraction. The service layer changes will be transparent to the UI.

**No changes required** - the component already:
- Queries by subject slug for subject-based selection
- Queries by year for year-based selection
- Applies exam_type and exam_year filters
- Handles empty question sets gracefully

### 3. Admin Question Management

The admin interface will be updated to support optional topic selection:

**Changes:**
- Topic dropdown becomes optional
- Subject dropdown becomes required (if topic not selected)
- Validation ensures either subject_id or topic_id is provided
- Display shows both subject and topic when available

### 4. Question Import

The import functionality will be updated to allow direct subject assignment:

**Changes:**
- Topic selection becomes optional
- Subject selection becomes required
- Import validates that subject_id is provided
- Bulk import supports questions without topics

## Data Models

### Updated Question Model

```typescript
interface Question {
  id: string;
  subject_id: string | null;  // NEW: Direct subject reference
  topic_id: string | null;     // UPDATED: Now nullable
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  exam_year?: number;
  exam_type?: 'JAMB' | 'WAEC';
  question_number?: number;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Database Constraints

```sql
-- At least one of subject_id or topic_id must be provided
ALTER TABLE questions
ADD CONSTRAINT questions_subject_or_topic_check
CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Subject-based query returns all subject questions
*For any* active subject and exam type, querying questions by subject_id should return all active questions for that subject and exam type, regardless of whether they have a topic_id assigned.
**Validates: Requirements 1.1, 1.2**

### Property 2: Null topic_id is valid
*For any* question with a valid subject_id, the question should be insertable and queryable even when topic_id is null.
**Validates: Requirements 2.1, 2.2**

### Property 3: Query performance is maintained
*For any* subject-based query with filters, the database query should complete in under 2 seconds for typical dataset sizes (up to 1000 questions per subject).
**Validates: Requirements 3.1, 3.2, 7.1, 7.2**

### Property 4: Backward compatibility preserved
*For any* existing question with a topic_id, the question should remain queryable through both topic-based and subject-based queries after migration.
**Validates: Requirements 2.2, 2.3**

### Property 5: Subject_id backfill correctness
*For any* question with a topic_id before migration, after migration the question's subject_id should match the topic's subject_id.
**Validates: Requirements 4.2**

### Property 6: Import validation
*For any* question import attempt, the system should accept the question if and only if either a valid subject_id or a valid topic_id is provided.
**Validates: Requirements 5.4**

### Property 7: Filter combination correctness
*For any* combination of filters (exam_type, exam_year, subject_id), the query should return only questions that match all specified filters.
**Validates: Requirements 3.3, 7.3**

## Error Handling

### Database Migration Errors
- **Scenario**: Migration fails to add subject_id column
- **Handling**: Rollback transaction, log error, prevent application startup
- **Recovery**: Manual intervention required, check database permissions

### Backfill Errors
- **Scenario**: Some questions have invalid topic_id references
- **Handling**: Log orphaned questions, set subject_id to null, flag for manual review
- **Recovery**: Admin interface to assign correct subject_id

### Query Errors
- **Scenario**: Subject not found for given slug
- **Handling**: Return empty array, log warning
- **User Experience**: Show "No questions available" message

### Import Validation Errors
- **Scenario**: Question import with neither subject_id nor topic_id
- **Handling**: Reject import, show validation error
- **User Experience**: Clear error message indicating required fields

### Performance Degradation
- **Scenario**: Query takes longer than 2 seconds
- **Handling**: Log slow query, check index usage
- **Recovery**: Analyze query plan, add additional indexes if needed

## Testing Strategy

### Dual Testing Approach

This feature will use both unit testing and property-based testing to ensure correctness:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library. Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with the format: `**Feature: remove-topic-dependency, Property {number}: {property_text}**`
- Explicitly reference the correctness property from this design document

**Property Test Examples:**

```typescript
// Property 1: Subject-based query returns all subject questions
test('Property 1: Subject queries return all questions regardless of topic', async () => {
  // **Feature: remove-topic-dependency, Property 1: Subject-based query returns all subject questions**
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        subjectId: fc.uuid(),
        examType: fc.constantFrom('JAMB', 'WAEC'),
        questionsWithTopic: fc.array(questionGenerator(), { minLength: 1, maxLength: 10 }),
        questionsWithoutTopic: fc.array(questionGenerator(), { minLength: 1, maxLength: 10 })
      }),
      async ({ subjectId, examType, questionsWithTopic, questionsWithoutTopic }) => {
        // Setup: Insert questions with and without topics
        // Execute: Query by subject_id and exam_type
        // Assert: All questions returned, regardless of topic_id presence
      }
    ),
    { numRuns: 100 }
  );
});

// Property 2: Null topic_id is valid
test('Property 2: Questions with null topic_id are valid', async () => {
  // **Feature: remove-topic-dependency, Property 2: Null topic_id is valid**
  await fc.assert(
    fc.asyncProperty(
      questionWithNullTopicGenerator(),
      async (question) => {
        // Execute: Insert question with null topic_id
        // Assert: Insert succeeds and question is queryable
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

Unit tests will cover:
- Specific database migration scenarios
- Edge cases (empty results, invalid slugs)
- Error handling paths
- Integration between Question Service and database
- Admin interface validation logic

**Unit Test Examples:**

```typescript
describe('QuestionService', () => {
  test('returns empty array for non-existent subject', async () => {
    const result = await questionService.getQuestionsBySubjectSlug('non-existent');
    expect(result).toEqual([]);
  });

  test('filters by exam_year correctly', async () => {
    // Setup questions with different years
    const result = await questionService.getQuestionsBySubjectSlug('mathematics', {
      exam_year: 2023
    });
    expect(result.every(q => q.exam_year === 2023)).toBe(true);
  });

  test('handles questions with and without topics', async () => {
    // Setup mixed questions
    const result = await questionService.getQuestionsBySubjectId(subjectId);
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing

Integration tests will verify:
- End-to-end quiz flow without topic selection
- Database migration and backfill process
- Question import with direct subject assignment
- Admin interface CRUD operations

### Performance Testing

Performance tests will verify:
- Query response times under load
- Index effectiveness
- Concurrent query handling

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Add subject_id column (nullable)
2. **Phase 2**: Backfill subject_id from topics
3. **Phase 3**: Make topic_id nullable
4. **Phase 4**: Add validation constraint
5. **Phase 5**: Update application code
6. **Phase 6**: Deploy and monitor

### Rollback Plan

If issues arise:
1. Revert application code changes
2. Keep database schema changes (they're backward compatible)
3. Monitor for errors
4. Fix issues and redeploy

### Monitoring

Key metrics to monitor:
- Query performance (p50, p95, p99)
- Error rates for question queries
- Questions without subject_id or topic_id
- Import success/failure rates

## Dependencies

- Supabase PostgreSQL database
- TypeScript/JavaScript runtime
- fast-check library for property-based testing
- Existing Question Service, Subject Service
- Admin interface components
- Question import functionality