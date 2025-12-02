# Requirements Document

## Introduction

This document specifies the requirements for fixing the authentication issue where the admin user reubensunday1220@gmail.com cannot log in to the system. The system currently shows "gmail failed to login" error. This fix will ensure robust admin authentication and proper user profile management.

## Glossary

- **Admin User**: A user with elevated privileges who can access administrative features
- **Super User**: An admin user with the highest level of system access
- **User Profile**: A record in the user_profiles table containing extended user information
- **RLS (Row Level Security)**: PostgreSQL security feature that restricts database row access based on policies
- **Auth System**: The Supabase authentication system managing user login and session
- **Case-Insensitive Comparison**: String comparison that treats uppercase and lowercase letters as equivalent

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to log in with my email address regardless of letter casing, so that I can access the system reliably.

#### Acceptance Criteria

1. WHEN an admin user enters their email with any combination of uppercase/lowercase letters THEN the Auth System SHALL authenticate them successfully
2. WHEN the Auth System compares admin emails THEN the Auth System SHALL normalize both stored and input emails to lowercase before comparison
3. WHEN the Auth System validates admin status THEN the Auth System SHALL trim whitespace from email addresses before comparison
4. WHEN an admin email is stored in the system configuration THEN the Auth System SHALL store it in lowercase format

### Requirement 2

**User Story:** As an admin user, I want my user profile to be created automatically when I sign up, so that I can log in without database errors.

#### Acceptance Criteria

1. WHEN a new user signs up THEN the Auth System SHALL create a corresponding user_profiles record automatically
2. WHEN a user_profiles record is created THEN the Auth System SHALL populate the email field with the user's authentication email
3. WHEN an existing user without a profile attempts to log in THEN the Auth System SHALL create their missing profile record
4. WHEN the profile creation fails THEN the Auth System SHALL log the error but allow login to proceed

### Requirement 3

**User Story:** As an admin user, I want clear error messages when login fails, so that I can understand what went wrong.

#### Acceptance Criteria

1. WHEN authentication fails due to invalid credentials THEN the Auth System SHALL display "Invalid email or password"
2. WHEN authentication fails due to network issues THEN the Auth System SHALL display "Network error. Please check your connection"
3. WHEN authentication fails due to database errors THEN the Auth System SHALL display "System error. Please try again later"
4. WHEN authentication succeeds but profile update fails THEN the Auth System SHALL log the error without blocking login

### Requirement 4

**User Story:** As a system administrator, I want admin emails to be managed in a centralized configuration, so that I can easily add or remove admin users.

#### Acceptance Criteria

1. WHEN the system initializes THEN the Auth System SHALL load admin emails from a centralized configuration
2. WHEN checking admin status THEN the Auth System SHALL reference the centralized admin email list
3. WHEN an admin email is added to the configuration THEN the Auth System SHALL recognize it immediately without code changes
4. WHERE the system supports environment variables THEN the Auth System SHALL allow admin emails to be configured via environment variables

### Requirement 5

**User Story:** As the super admin reubensunday1220@gmail.com, I want to ensure my account exists and is properly configured, so that I can always access the system.

#### Acceptance Criteria

1. WHEN the system is deployed THEN the Auth System SHALL verify that reubensunday1220@gmail.com has a user_profiles record
2. WHEN reubensunday1220@gmail.com logs in THEN the Auth System SHALL update the last_login timestamp
3. WHEN reubensunday1220@gmail.com accesses admin features THEN the Auth System SHALL grant full administrative privileges
4. IF reubensunday1220@gmail.com profile is missing THEN the Auth System SHALL create it with admin privileges

### Requirement 6

**User Story:** As a developer, I want comprehensive logging for authentication failures, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN authentication fails THEN the Auth System SHALL log the error details to the console
2. WHEN profile creation fails THEN the Auth System SHALL log the user ID and error message
3. WHEN admin status check occurs THEN the Auth System SHALL log the email being checked
4. WHEN logging sensitive information THEN the Auth System SHALL redact passwords and tokens
