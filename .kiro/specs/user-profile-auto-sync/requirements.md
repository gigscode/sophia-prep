# Requirements Document

## Introduction

The system currently requires manual SQL execution to sync authenticated users with the user_profiles table. This is a critical failure in the user onboarding flow. Users who sign up successfully in the auth system should automatically have corresponding profile records created without any manual intervention. This feature will establish a reliable, automated user profile synchronization system that works consistently across all signup methods.

## Glossary

- **Auth System**: Supabase's authentication system (auth.users table) that handles user credentials and authentication
- **User Profile**: Application-level user data stored in the user_profiles table
- **Database Trigger**: PostgreSQL function that automatically executes when specific database events occur
- **Profile Sync**: The process of ensuring every authenticated user has a corresponding user_profiles record
- **Signup Flow**: The complete process from user registration to profile creation

## Requirements

### Requirement 1

**User Story:** As a new user, I want my profile to be automatically created when I sign up, so that I can immediately use all application features without manual intervention.

#### Acceptance Criteria

1. WHEN a user completes signup through the auth system THEN the system SHALL create a corresponding user_profiles record immediately
2. WHEN the user_profiles record is created THEN the system SHALL populate it with the user's email and full_name from auth metadata
3. WHEN profile creation occurs THEN the system SHALL set default values for subscription_plan ('Free'), is_active (true), and timestamps
4. WHEN profile creation fails THEN the system SHALL log the error and retry the creation on the user's first login attempt
5. WHEN a user signs up THEN the system SHALL complete the entire flow within 2 seconds without requiring manual database operations

### Requirement 2

**User Story:** As a system administrator, I want the profile creation mechanism to be resilient to failures, so that no users are left without profiles even if temporary issues occur.

#### Acceptance Criteria

1. WHEN the database trigger fails to create a profile THEN the system SHALL catch the error and log it for monitoring
2. WHEN a user logs in without an existing profile THEN the system SHALL automatically create the missing profile before completing login
3. WHEN profile creation is attempted multiple times THEN the system SHALL handle duplicate key errors gracefully without failing the user's request
4. WHEN the system detects a missing profile THEN the system SHALL create it within the same request cycle without user-visible delays
5. WHEN profile creation succeeds through the fallback mechanism THEN the system SHALL log the event for audit purposes

### Requirement 3

**User Story:** As a developer, I want clear visibility into profile creation success and failures, so that I can monitor system health and debug issues quickly.

#### Acceptance Criteria

1. WHEN a profile is created via database trigger THEN the system SHALL log the creation with user ID and timestamp
2. WHEN a profile is created via frontend fallback THEN the system SHALL log the creation with a distinct marker indicating fallback activation
3. WHEN profile creation fails THEN the system SHALL log the error with user ID, error message, and stack trace
4. WHEN the system starts up THEN the system SHALL verify the database trigger exists and is properly configured
5. WHEN profile sync issues are detected THEN the system SHALL provide actionable error messages that indicate the specific failure point

### Requirement 4

**User Story:** As a system administrator, I want a one-time migration to fix existing users without profiles, so that the system reaches a consistent state before the new mechanism takes over.

#### Acceptance Criteria

1. WHEN the migration script runs THEN the system SHALL identify all auth.users without corresponding user_profiles records
2. WHEN missing profiles are identified THEN the system SHALL create user_profiles records for each missing user with data from auth.users
3. WHEN the migration completes THEN the system SHALL report the number of profiles created and any errors encountered
4. WHEN the migration encounters an error for a specific user THEN the system SHALL continue processing remaining users and report all errors at the end
5. WHEN the migration runs multiple times THEN the system SHALL skip users who already have profiles without errors
