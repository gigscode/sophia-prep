# Implementation Plan

- [x] 1. Set up timer service and database schema






  - Create timer service with configuration lookup and countdown functionality
  - Create timer_configurations database table with default entries
  - Add quiz_mode, exam_type, exam_year columns to quiz_attempts table if not exists
  - _Requirements: 6.1, 6.2, 9.1, 9.2, 9.3, 9.4_

- [ ]* 1.1 Write property test for timer configuration lookup
  - **Property 13: Timer configuration lookup**
  - **Validates: Requirements 6.1**

- [ ]* 1.2 Write property test for timer configuration fallback
  - **Property 22: Timer configuration fallback**
  - **Validates: Requirements 9.3**

- [x] 2. Create unified quiz configuration types and interfaces




  - Define QuizConfig, QuizState, and QuizMode types
  - Create mode-specific configuration helpers
  - Define timer service interface
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 3. Implement mode selection flow component




  - Create ModeSelectionPage component with multi-step wizard
  - Implement exam type selection screen (WAEC/JAMB)
  - Implement mode selection screen (Practice/Exam)
  - Implement method selection screen (Subject/Year)
  - Implement specific selection screen (subject dropdown or year picker)
  - Add navigation between steps with state management
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 4.1_

- [ ]* 3.1 Write property test for exam type change resets selections
  - **Property 2: Exam type change resets selections**
  - **Validates: Requirements 1.3**

- [ ]* 3.2 Write property test for exam type selection loads filtered subjects
  - **Property 1: Exam type selection loads filtered subjects**
  - **Validates: Requirements 1.2**
-

- [x] 4. Create UnifiedQuiz component




  - Create new UnifiedQuiz component accepting QuizConfig
  - Implement question loading based on config (subject or year)
  - Implement answer recording and navigation
  - Add conditional timer display based on mode
  - Add conditional explanation visibility based on mode
  - Implement auto-submit on timer expiration
  - Implement manual submit with mode-based enabling/disabling
  - _Requirements: 2.2, 2.3, 5.1, 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 7.1, 7.2, 11.1, 11.2, 11.3_

- [ ]* 4.1 Write property test for practice mode configuration
  - **Property 3: Practice mode configuration**
  - **Validates: Requirements 2.2**

- [ ]* 4.2 Write property test for exam simulation mode configuration
  - **Property 4: Exam simulation mode configuration**
  - **Validates: Requirements 2.3**

- [ ]* 4.3 Write property test for practice mode manual submission
  - **Property 12: Practice mode manual submission**
  - **Validates: Requirements 5.4**

- [ ]* 4.4 Write property test for exam mode submit prevention
  - **Property 14: Exam mode submit prevention**
  - **Validates: Requirements 6.4, 11.1**

- [x] 5. Implement question filtering logic





  - Enhance questionService to support combined filters
  - Implement subject-based question loading
  - Implement year-based question loading
  - Implement subject + year combined filtering
  - _Requirements: 3.2, 3.3, 4.2, 12.4_

- [ ]* 5.1 Write property test for subject filtering
  - **Property 5: Subject filtering**
  - **Validates: Requirements 3.2**

- [ ]* 5.2 Write property test for subject and year filtering
  - **Property 6: Subject and year filtering**
  - **Validates: Requirements 3.3**

- [ ]* 5.3 Write property test for year filtering
  - **Property 7: Year filtering**
  - **Validates: Requirements 4.2**

- [ ]* 5.4 Write property test for question query filtering
  - **Property 27: Question query filtering**
  - **Validates: Requirements 12.4**

- [x] 6. Implement timer service




  - Create TimerService class with start, stop, pause, resume methods
  - Implement countdown with localStorage persistence
  - Implement timer expiration callback
  - Add timer state restoration on page reload
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4_

- [ ]* 6.1 Write property test for year-based exam timer configuration
  - **Property 8: Year-based exam timer configuration**
  - **Validates: Requirements 4.3**

- [ ]* 6.2 Write property test for timer configuration hot-reload
  - **Property 23: Timer configuration hot-reload**
  - **Validates: Requirements 9.4**
-

- [x] 7. Implement explanation visibility logic




  - Add conditional rendering for explanations in practice mode
  - Hide explanations during exam simulation
  - Show explanations in review screen after completion
  - Add next question control in practice mode
  - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4_

- [ ]* 7.1 Write property test for practice mode feedback visibility
  - **Property 9: Practice mode feedback visibility**
  - **Validates: Requirements 5.1**

- [ ]* 7.2 Write property test for practice mode explanation visibility
  - **Property 10: Practice mode explanation visibility**
  - **Validates: Requirements 5.2**

- [ ]* 7.3 Write property test for practice mode navigation control
  - **Property 11: Practice mode navigation control**
  - **Validates: Requirements 5.3**

- [ ]* 7.4 Write property test for exam mode feedback suppression
  - **Property 15: Exam mode feedback suppression**
  - **Validates: Requirements 7.1**

- [ ]* 7.5 Write property test for exam mode explanation suppression
  - **Property 16: Exam mode explanation suppression**
  - **Validates: Requirements 7.2**

- [ ]* 7.6 Write property test for post-completion explanation visibility
  - **Property 17: Post-completion explanation visibility**
  - **Validates: Requirements 7.3, 7.4**

- [x] 8. Enhance analytics service for mode tracking




  - Update saveQuizAttempt to accept quiz_mode, exam_type, exam_year
  - Modify quiz attempt creation to include mode metadata
  - Update quiz history retrieval to include mode information
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.3_

- [ ]* 8.1 Write property test for quiz attempt persistence
  - **Property 18: Quiz attempt persistence**
  - **Validates: Requirements 8.1**

- [ ]* 8.2 Write property test for question response persistence
  - **Property 19: Question response persistence**
  - **Validates: Requirements 8.2**

- [ ]* 8.3 Write property test for immediate persistence
  - **Property 20: Immediate persistence**
  - **Validates: Requirements 8.3**

- [ ]* 8.4 Write property test for attempt history retrieval
  - **Property 21: Attempt history retrieval**
  - **Validates: Requirements 8.4**

- [ ]* 8.5 Write property test for mode label consistency
  - **Property 24: Mode label consistency**
  - **Validates: Requirements 10.3**

- [x] 9. Create quiz results and review screen



  - Create results screen showing score and time taken
  - Display mode label consistently with selection
  - Show all questions with user answers and correct answers
  - Display explanations for all questions
  - Add navigation back to mode selection
  - _Requirements: 7.3, 7.4, 10.3_

- [x] 10. Update routing and navigation




  - Add route for mode selection page
  - Add route for unified quiz component
  - Update navigation from home page to mode selection
  - Add breadcrumb navigation
  - _Requirements: 1.1, 2.1_

- [x] 11. Verify admin question import supports exam metadata




  - Verify exam_type and exam_year fields are accepted in import
  - Test question import with and without metadata
  - Verify null handling for optional fields
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]* 11.1 Write property test for question import with exam metadata
  - **Property 25: Question import with exam metadata**
  - **Validates: Requirements 12.1, 12.2**

- [ ]* 11.2 Write property test for question import without exam metadata
  - **Property 26: Question import without exam metadata**
  - **Validates: Requirements 12.3**

- [x] 12. Implement error handling and edge cases



  - Add error handling for timer failures
  - Add error handling for question loading failures
  - Add error handling for submission failures
  - Implement quiz state persistence to localStorage
  - Add state restoration on page reload
  - _Requirements: All_


- [x] 13. Add accessibility features


  - Add keyboard navigation support
  - Add ARIA labels for all interactive elements
  - Add screen reader announcements for timer and feedback
  - Ensure color contrast meets WCAG AA standards
  - Test with keyboard-only navigation
  - _Requirements: All_

- [x] 14. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Update existing quiz pages to use new system



  - Migrate CBTQuiz.tsx to use UnifiedQuiz component
  - Migrate PracticeModeQuiz.tsx to use UnifiedQuiz component
  - Update home page links to point to mode selection
  - Remove duplicate code from old components
  - _Requirements: All_

- [x] 16. Final testing and polish



  - Test all 8 mode combinations end-to-end
  - Verify timer accuracy and auto-submit
  - Test quiz state persistence across refresh
  - Verify analytics data accuracy
  - Test on mobile devices
  - _Requirements: All_

- [x] 17. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
