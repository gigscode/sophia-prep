# Implementation Plan: Remove Topic Dependency

## Task List

- [x] 1. Create database migration to add subject_id column










  - Create SQL migration file to add subject_id column to questions table
  - Make topic_id nullable
  - Add foreign key constraint for subject_id
  - Create index on subject_id for query performance
  - Add check constraint to ensure either subject_id or topic_id is provided
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.4_


- [x] 2. Create backfill script for existing questions







  - Write SQL script to populate subject_id from topic relationships
  - Handle orphaned questions (invalid topic_id references)
  - Log questions that need manual review
  - Verify backfill correctness
  - _Requirements: 4.2_

- [ ]* 2.1 Write property test for backfill correctness
  - **Property 5: Subject_id backfill correctness**
  - **Validates: Requirements 4.2**

- [x] 3. Update Question Service to query by subject_id directly








  - [x] 3.1 Implement getQuestionsBySubjectId method


    - Create new method that queries questions by subject_id directly
    - Apply exam_type and exam_year filters at database level
    - Handle null/empty results gracefully
    - _Requirements: 3.1, 3.2, 4.4_



  - [x] 3.2 Update getQuestionsBySubjectSlug to use subject_id










    - Modify existing method to query by subject_id instead of topic_ids
    - Remove topic lookup step
    - Maintain same method signature for backward compatibility
    - Apply all filters in single database query
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3_

  - [ ]* 3.3 Write property test for subject-based queries
    - **Property 1: Subject-based query returns all subject questions**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 3.4 Write property test for null topic_id handling
    - **Property 2: Null topic_id is valid**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.5 Write property test for filter combinations
    - **Property 7: Filter combination correctness**
    - **Validates: Requirements 3.3, 7.3**

  - [ ]* 3.6 Write unit tests for Question Service updates
    - Test empty results for non-existent subjects
    - Test exam_year filtering
    - Test exam_type filtering
    - Test questions with and without topics
    - Test error handling
    - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 4. Update getQuestionsByFilters method





  - Ensure method works with new subject_id column
  - Maintain backward compatibility with topic-based queries
  - Optimize query performance
  - _Requirements: 3.3, 7.3_

- [ ]* 4.1 Write property test for query performance
  - **Property 3: Query performance is maintained**
  - **Validates: Requirements 3.1, 3.2, 7.1, 7.2**

- [x] 5. Update question import functionality





  - [x] 5.1 Make topic selection optional in import UI







    - Update import form to make topic dropdown optional
    - Make subject dropdown required when topic not selected
    - Update form validation logic
    - _Requirements: 5.1, 5.3_


  - [x] 5.2 Update import validation logic







    - Validate that either subject_id or topic_id is provided
    - Handle direct subject assignment
    - Update error messages
    - _Requirements: 5.2, 5.4_

  - [ ]* 5.3 Write property test for import validation
    - **Property 6: Import validation**
    - **Validates: Requirements 5.4**

  - [ ]* 5.4 Write unit tests for import functionality
    - Test import with subject only
    - Test import with topic only
    - Test import with both subject and topic
    - Test validation errors
    - _Requirements: 5.1, 5.2, 5.4_


- [-] 6. Update admin question management interface

  - [x] 6.1 Update question create/edit forms






    - Make topic field optional
    - Show subject field prominently
    - Update validation to require either subject or topic
    - _Requirements: 6.2, 6.3_

  - [x] 6.2 Update question list display





    - Show both subject and topic when available
    - Show subject only when topic is null
    - Update filtering to support subject-based filtering
    - _Requirements: 6.1, 6.4_

  - [ ]* 6.3 Write unit tests for admin interface
    - Test form validation
    - Test display with various question configurations
    - Test filtering functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4_





- [ ] 7. Verify UnifiedQuiz component compatibility

  - Review UnifiedQuiz component to ensure it works with updated Question Service
  - Test subject-based quiz flow
  - Test year-based quiz flow
  - Verify error handling for empty question sets
  - _Requirements: 1.3, 1.4, 7.4_

- [ ]* 7.1 Write property test for backward compatibility
  - **Property 4: Backward compatibility preserved**
  - **Validates: Requirements 2.2, 2.3**

- [ ]* 7.2 Write integration tests for quiz flow
  - Test complete quiz flow without topic selection
  - Test quiz with mixed questions (with and without topics)
  - Test error scenarios




  - _Requirements: 1.1, 1.2, 1.3, 1.4_





- [x] 8. Run database migration



  - Execute migration in development environment
  - Verify schema changes
  - Run backfill script
  - Verify data integrity
  - _Requirements: 2.1, 2.2, 4.1, 4.2_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.




- [x] 10. Deploy and monitor








  - Deploy updated code to staging
  - Run smoke tests
  - Monitor query performance
  - Monitor error rates
  - Verify quiz functionality end-to-end
  - _Requirements: 7.1, 7.2_
