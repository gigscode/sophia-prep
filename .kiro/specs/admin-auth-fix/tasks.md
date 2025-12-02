# Implementation Plan

- [x] 1. Create admin configuration module




  - Create `src/config/admin.ts` with centralized admin email management
  - Implement email normalization function
  - Implement isAdmin function with case-insensitive checking
  - Support environment variable configuration for admin emails
  - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [ ]* 1.1 Write property test for email normalization idempotence
  - **Property 1: Email normalization is idempotent**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Write property test for lowercase output
  - **Property 2: Email normalization produces lowercase output**
  - **Validates: Requirements 1.2**

- [ ]* 1.3 Write property test for whitespace trimming
  - **Property 3: Whitespace trimming is consistent**
  - **Validates: Requirements 1.3**

- [ ]* 1.4 Write unit tests for admin configuration
  - Test isAdmin with various email formats
  - Test case-insensitive matching
  - Test environment variable loading
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. Enhance useAuth hook with profile management





  - Import admin configuration from centralized module
  - Update mapUser function to use normalized email comparison
  - Implement ensureUserProfile function to create missing profiles
  - Make profile operations non-blocking (wrap in try-catch)
  - Add detailed error logging with sensitive data redaction
  - _Requirements: 1.1, 2.3, 2.4, 3.4, 6.1, 6.2_

- [ ]* 2.1 Write property test for admin status case-insensitivity
  - **Property 4: Admin status check is case-insensitive**
  - **Validates: Requirements 1.1, 4.2**

- [ ]* 2.2 Write unit tests for ensureUserProfile function
  - Test profile creation for users without profiles
  - Test handling of existing profiles
  - Test error handling doesn't block login
  - _Requirements: 2.3, 2.4_





- [ ] 3. Implement error categorization and user-friendly messages

  - Create categorizeError function in useAuth hook
  - Map Supabase errors to user-friendly messages
  - Update login function to use categorized errors
  - Update LoginPage to display categorized error messages
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 3.1 Write unit tests for error categorization
  - Test invalid credentials error mapping



  - Test network error mapping

  - Test database error mapping
  - Test unknown error handling
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Add comprehensive logging with sensitive data protection

  - Add logging to authentication failures
  - Add logging to profile operations
  - Add logging to admin status checks
  - Implement sensitive data redaction (passwords, tokens)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x]* 4.1 Write property test for sensitive data redaction



  - **Property 5: Sensitive data is never logged**
  - **Validates: Requirements 6.4**

- [ ]* 4.2 Write unit tests for logging behavior
  - Test authentication failure logging
  - Test profile operation logging



  - Test admin check logging
  - _Requirements: 6.1, 6.2, 6.3_

- [-] 5. Create admin profile verification script


  - Create `scripts/ensure-admin-profiles.js`
  - Check if admin users exist in auth.users
  - Verify corresponding user_profiles records exist
  - Create missing profiles with admin metadata
  - Report status for each admin user
  - _Requirements: 5.1, 5.4_

- [ ] 6. Update environment configuration

  - Add VITE_ADMIN_EMAILS to .env.example
  - Document admin email configuration in comments
  - Update README with admin configuration instructions
  - _Requirements: 4.4_

- [ ] 7. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Manual testing and verification

  - Test login as reubensunday1220@gmail.com
  - Test login with different email cases
  - Test login with whitespace in email
  - Verify admin features are accessible
  - Verify user_profiles record exists in database
  - Verify last_login timestamp updates
  - _Requirements: 1.1, 5.2, 5.3_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
