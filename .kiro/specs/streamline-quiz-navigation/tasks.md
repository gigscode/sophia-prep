# Implementation Plan

- [x] 1. Create quiz navigation utility functions





  - Create `src/utils/quiz-navigation.ts` with query parameter parsing and config building functions
  - Implement `parseLegacyQuizParams` function to extract subject, year, and type from URL parameters
  - Implement `buildQuizConfigFromLegacy` function to construct QuizConfig from parsed parameters
  - Handle "ALL" values and missing parameters appropriately
  - _Requirements: 1.3, 1.5, 3.2_

- [ ]* 1.1 Write property test for query parameter parsing
  - **Property 1: Query parameter preservation**
  - **Validates: Requirements 1.3, 1.5**

- [ ]* 1.2 Write property test for config building
  - **Property 5: Configuration validation**
  - **Validates: Requirements 3.3**

- [ ]* 1.3 Write unit tests for utility functions
  - Test parsing with valid parameters
  - Test parsing with "ALL" values
  - Test parsing with missing parameters
  - Test config building with complete parameters
  - Test config building with minimal parameters
  - Test validation of built configurations
  - _Requirements: 1.3, 1.5, 3.2, 3.3_

- [x] 2. Create LegacyQuizRedirect component





  - Create `src/components/quiz/LegacyQuizRedirect.tsx` component
  - Accept `mode` prop ('practice' or 'exam')
  - Parse URL query parameters using utility function
  - Build QuizConfig from parsed parameters
  - Handle loading state while looking up subject information
  - Redirect to `/quiz/unified` with config on success
  - Redirect to `/quiz/mode-selection` on error
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.2, 3.3, 3.4_

- [ ]* 2.1 Write property test for direct navigation
  - **Property 2: Direct navigation with valid parameters**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 2.2 Write property test for fallback behavior
  - **Property 3: Fallback to mode selection**
  - **Validates: Requirements 3.4**

- [ ]* 2.3 Write unit tests for LegacyQuizRedirect component
  - Test component renders loading state initially
  - Test redirect to unified quiz with valid parameters
  - Test redirect to mode selection with missing subject
  - Test redirect to mode selection with invalid subject
  - Test error handling for network failures
  - _Requirements: 1.1, 1.2, 3.4_


- [x] 3. Update App.tsx routing configuration




  - Replace `<Navigate>` components for `/quiz/practice` and `/quiz/cbt` routes
  - Use `<LegacyQuizRedirect mode="practice" />` for `/quiz/practice` route
  - Use `<LegacyQuizRedirect mode="exam" />` for `/quiz/cbt` route
  - Ensure mode selection page route remains unchanged
  - Ensure unified quiz route remains unchanged
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.1 Write integration test for routing
  - Test `/quiz/practice` route uses LegacyQuizRedirect
  - Test `/quiz/cbt` route uses LegacyQuizRedirect
  - Test `/quiz/mode-selection` route still works
  - _Requirements: 2.1, 2.2, 2.4_


- [x] 4. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.


- [x] 5. Test end-to-end navigation flows







  - Manually test clicking Practice button from subjects page
  - Manually test clicking Quiz button from subjects page
  - Verify quiz loads with correct subject and mode
  - Verify mode selection page is still accessible directly
  - Test with various subjects and exam types
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.4_

- [ ]* 5.1 Write property test for mode selection availability
  - **Property 4: Mode selection availability**
  - **Validates: Requirements 2.1, 2.4**

- [ ]* 5.2 Write integration tests for navigation flows
  - Test Practice button navigation from subjects page
  - Test Quiz button navigation from subjects page
  - Test quiz loads with correct configuration
  - Test mode selection page accessibility
  - Test error recovery flows
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.4, 3.4_


- [ ] 6. Final Checkpoint - Make sure all tests are passing


  - Ensure all tests pass, ask the user if questions arise.
