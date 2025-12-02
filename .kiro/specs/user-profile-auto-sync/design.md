# Design Document: User Profile Auto-Sync

## Overview

This design establishes a robust, multi-layered approach to ensure every authenticated user has a corresponding user_profiles record. The system uses a database trigger as the primary mechanism, with a frontend fallback for resilience, comprehensive logging for observability, and a one-time migration to fix existing data inconsistencies.

The current system has a database trigger defined in the schema, but it may not be deployed or may be failing silently. The frontend has a fallback mechanism (`ensureUserProfile`) that only runs on login, not signup, leaving a gap where new users don't get profiles until they log in a second time.

## Architecture

### Three-Layer Defense Strategy

1. **Primary Layer: Database Trigger**
   - PostgreSQL trigger on `auth.users` table
   - Executes immediately after INSERT
   - Creates user_profiles record with data from auth metadata
   - Runs at database level, independent of application code

2. **Secondary Layer: Frontend Fallback**
   - Executes during signup flow (currently missing)
   - Executes during login flow (currently exists)
   - Catches cases where database trigger failed
   - Non-blocking - allows auth to succeed even if profile creation fails

3. **Tertiary Layer: Migration Script**
   - One-time execution to fix existing users
   - Identifies auth.users without user_profiles
   - Creates missing profiles in batch
   - Idempotent - safe to run multiple times

### Data Flow

```
User Signup
    ↓
Auth System Creates User (auth.users)
    ↓
Database Trigger Fires → Creates user_profiles ✓
    ↓ (if trigger fails)
Frontend Fallback → Creates user_profiles ✓
    ↓
User Can Access Application
```

## Components and Interfaces

### 1. Database Trigger Function

**Location**: `supabase/migrations/handle_new_user_trigger.sql`

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
```

**Responsibilities**:
- Extract user data from `NEW` record (auth.users row)
- Insert into user_profiles with default values
- Handle errors gracefully (log but don't block auth)
- Return NEW to allow auth.users insert to complete

**Error Handling**:
- Uses `EXCEPTION` block to catch constraint violations
- Logs errors to PostgreSQL logs
- Never raises exceptions that would block user signup

### 2. Frontend Signup Enhancement

**Location**: `src/hooks/useAuth.tsx`

**Function**: `signup(email, password, name)`

**Current Flow**:
```typescript
signup() → supabase.auth.signUp() → mapUser() → ensureUserProfile()
```

**Problem**: `ensureUserProfile()` is called in `mapUser()`, but `mapUser()` is only called on successful auth state change, which may not happen immediately after signup.

**New Flow**:
```typescript
signup() → supabase.auth.signUp() → ensureUserProfile() → mapUser()
```

**Changes**:
- Call `ensureUserProfile()` immediately after successful signup
- Don't wait for auth state change
- Make it non-blocking (catch errors, log, continue)

### 3. Frontend Login Fallback (Existing)

**Location**: `src/hooks/useAuth.tsx`

**Function**: `ensureUserProfile(supabaseUser)`

**Current Behavior**: ✓ Already works correctly
- Checks if profile exists
- Creates if missing
- Non-blocking
- Logs all operations

**No changes needed** - this is already a good safety net.

### 4. Migration Script

**Location**: `scripts/sync-user-profiles.js`

**Purpose**: One-time fix for existing users

**Algorithm**:
```javascript
1. Query all auth.users
2. LEFT JOIN with user_profiles
3. Filter WHERE user_profiles.id IS NULL
4. For each missing profile:
   - Create user_profiles record
   - Log success/failure
5. Report summary statistics
```

**Execution**: Run once via `node scripts/sync-user-profiles.js`

## Data Models

### auth.users (Supabase managed)
```typescript
{
  id: UUID
  email: string
  raw_user_meta_data: {
    full_name?: string
  }
  created_at: timestamp
}
```

### user_profiles (Application managed)
```typescript
{
  id: UUID (FK to auth.users.id)
  email: string
  full_name: string | null
  is_active: boolean (default: true)
  subscription_plan: string (default: 'Free')
  last_login: timestamp | null
  created_at: timestamp
  updated_at: timestamp
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Profile creation completeness
*For any* user signup through the auth system, the system should create a user_profiles record containing the user's email, full_name from metadata, subscription_plan='Free', is_active=true, and valid timestamps.
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Fallback mechanism activation
*For any* user login where no user_profiles record exists, the system should automatically create the missing profile with correct data before completing the login flow.
**Validates: Requirements 2.2, 2.4**

### Property 3: Idempotent profile creation
*For any* user, attempting to create a user_profiles record multiple times should handle duplicate key errors gracefully without throwing exceptions or failing the user's request.
**Validates: Requirements 2.3**

### Property 4: Error logging completeness
*For any* profile creation failure, the system should log an entry containing the user ID, error message, and sufficient context to identify the failure point.
**Validates: Requirements 3.3, 3.5**

### Property 5: Fallback logging distinction
*For any* profile created via the frontend fallback mechanism, the log entry should contain a distinct marker (e.g., "FALLBACK_PROFILE_CREATION") that differentiates it from trigger-created profiles.
**Validates: Requirements 3.2, 2.5**

### Property 6: Migration completeness
*For any* set of auth.users records, running the migration script should identify all users without user_profiles records and create profiles for each with correct data from auth.users.
**Validates: Requirements 4.1, 4.2**

### Property 7: Migration idempotency
*For any* database state, running the migration script multiple times should produce the same result without creating duplicate profiles or throwing errors for users who already have profiles.
**Validates: Requirements 4.5**

### Property 8: Migration error resilience
*For any* migration execution where some users cause errors, the system should continue processing all remaining users and report all errors in the final summary.
**Validates: Requirements 4.4**

## Error Handling

### Database Trigger Errors

**Scenario**: Trigger fails due to constraint violation, permission issue, or database error

**Handling**:
- Catch exception in trigger function using `EXCEPTION` block
- Log error to PostgreSQL logs with user ID and error details
- Return NEW to allow auth.users insert to complete
- User signup succeeds, profile creation deferred to frontend fallback

**Example**:
```sql
BEGIN
  INSERT INTO user_profiles ...
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Allow signup to proceed
END;
```

### Frontend Fallback Errors

**Scenario**: Frontend profile creation fails during signup or login

**Handling**:
- Catch error in try-catch block
- Log error with `console.error()` including user ID and error message
- Continue with authentication flow (don't block user)
- User can still access application
- Profile will be retried on next login

**Example**:
```typescript
try {
  await ensureUserProfile(user);
} catch (error) {
  console.error(`[FALLBACK_PROFILE_CREATION_FAILED] User ${user.id}:`, error);
  // Don't throw - allow login to proceed
}
```

### Migration Script Errors

**Scenario**: Migration fails for specific users

**Handling**:
- Catch errors for individual users
- Store error details in array
- Continue processing remaining users
- Report all errors at end with summary statistics

**Example**:
```javascript
const errors = [];
for (const user of missingUsers) {
  try {
    await createProfile(user);
  } catch (error) {
    errors.push({ userId: user.id, error: error.message });
  }
}
console.log(`Created ${successCount} profiles, ${errors.length} errors`);
```

### Network and Timeout Errors

**Scenario**: Network issues during profile creation

**Handling**:
- Set reasonable timeout (5 seconds)
- Catch network errors
- Log with specific error type
- Retry on next login (for frontend fallback)
- Don't block user authentication

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Trigger Function Test** (Database level)
   - Test trigger creates profile with correct data
   - Test trigger handles missing metadata gracefully
   - Test trigger doesn't block signup on error

2. **Frontend Fallback Test**
   - Test `ensureUserProfile()` creates missing profiles
   - Test `ensureUserProfile()` skips existing profiles
   - Test `ensureUserProfile()` handles errors without throwing

3. **Migration Script Test**
   - Test script identifies missing profiles correctly
   - Test script creates profiles with correct data
   - Test script handles errors for individual users
   - Test script is idempotent

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property testing library):

**Configuration**: Each property test will run a minimum of 100 iterations.

**Test Tagging**: Each property-based test will include a comment with this format:
```typescript
// **Feature: user-profile-auto-sync, Property 1: Profile creation completeness**
```

**Properties to Test**:

1. **Property 1: Profile creation completeness**
   - Generate random user data (email, name, id)
   - Create auth user
   - Verify user_profiles record exists with correct data
   - Verify default values are set

2. **Property 2: Fallback mechanism activation**
   - Generate random auth users without profiles
   - Trigger login flow
   - Verify profiles are created before login completes

3. **Property 3: Idempotent profile creation**
   - Generate random user data
   - Attempt profile creation multiple times
   - Verify no errors thrown
   - Verify only one profile exists

4. **Property 4: Error logging completeness**
   - Generate random error scenarios
   - Trigger profile creation failures
   - Verify logs contain user ID, error message, context

5. **Property 5: Fallback logging distinction**
   - Generate random users
   - Trigger fallback mechanism
   - Verify logs contain "FALLBACK_PROFILE_CREATION" marker

6. **Property 6: Migration completeness**
   - Generate random sets of users with/without profiles
   - Run migration
   - Verify all missing profiles are created

7. **Property 7: Migration idempotency**
   - Generate random database states
   - Run migration multiple times
   - Verify same result each time

8. **Property 8: Migration error resilience**
   - Generate random users, some with errors
   - Run migration
   - Verify all users processed, errors reported

### Integration Tests

Integration tests will verify the complete flow:

1. **End-to-End Signup Test**
   - Create new user via signup API
   - Verify auth.users record created
   - Verify user_profiles record created
   - Verify user can immediately access application

2. **End-to-End Login Fallback Test**
   - Create auth user without profile (simulate trigger failure)
   - Attempt login
   - Verify profile created during login
   - Verify user can access application

3. **Migration Integration Test**
   - Create test database with missing profiles
   - Run migration script
   - Verify all profiles created
   - Verify summary report is accurate

## Implementation Notes

### Database Trigger Deployment

The trigger must be deployed to Supabase:

1. Verify trigger doesn't already exist (or drop if it does)
2. Create function `handle_new_user()`
3. Create trigger `on_auth_user_created`
4. Test with new user signup
5. Verify in Supabase logs

### Frontend Changes

Minimal changes to `useAuth.tsx`:

1. Move `ensureUserProfile()` call to immediately after `signUp()` success
2. Add logging with "FALLBACK_PROFILE_CREATION" marker
3. Ensure non-blocking error handling

### Migration Script

One-time execution:

1. Create `scripts/sync-user-profiles.js`
2. Run once: `node scripts/sync-user-profiles.js`
3. Review output for errors
4. Verify all users have profiles
5. Archive script (keep for reference)

### Monitoring and Observability

**Metrics to Track**:
- Number of profiles created via trigger
- Number of profiles created via fallback
- Profile creation failures
- Users without profiles (should be zero)

**Logging Standards**:
- All profile operations log user ID (redacted email)
- All errors include stack traces
- Fallback operations include "FALLBACK_PROFILE_CREATION" marker
- Trigger operations include "TRIGGER_PROFILE_CREATION" marker

**Alerts**:
- Alert if fallback creation rate > 5% (indicates trigger issues)
- Alert if any users exist without profiles for > 1 hour
- Alert if profile creation failures > 1% of signups

## Security Considerations

### Row Level Security (RLS)

Existing RLS policies on user_profiles:
- Users can only view/update their own profiles
- Profile creation allowed for authenticated users
- No changes needed to RLS policies

### Trigger Security

- Trigger function uses `SECURITY DEFINER` to run with elevated privileges
- This is necessary to insert into user_profiles from auth.users context
- Function is carefully scoped to only insert, not update or delete
- No user input is directly used (only auth system data)

### Data Privacy

- Logs redact sensitive information (emails, passwords, tokens)
- Only user IDs and non-sensitive metadata logged
- Error messages don't expose internal system details

## Performance Considerations

### Database Trigger Performance

- Trigger adds ~10-50ms to signup time
- Acceptable overhead for improved reliability
- Runs asynchronously from user perspective
- No user-facing impact

### Frontend Fallback Performance

- Profile check adds ~50-100ms to login time
- Only runs if profile missing (rare after trigger deployed)
- Non-blocking - doesn't delay UI rendering
- Acceptable overhead for safety net

### Migration Performance

- Batch processing for large user bases
- Process 100 users at a time
- Estimated 1-2 seconds per 100 users
- For 10,000 users: ~3-5 minutes total
- Run during low-traffic period

## Rollback Plan

If issues arise:

1. **Disable Trigger**: `DROP TRIGGER on_auth_user_created`
2. **Rely on Frontend Fallback**: Already in place, will handle all profile creation
3. **Run Migration**: Fix any users without profiles
4. **Investigate**: Review logs to identify trigger failure cause
5. **Fix and Redeploy**: Update trigger function, redeploy

## Success Criteria

The implementation is successful when:

1. ✓ All new signups automatically get user_profiles records
2. ✓ Zero manual SQL execution required
3. ✓ All existing users have profiles (after migration)
4. ✓ Fallback mechanism catches any trigger failures
5. ✓ Comprehensive logging enables easy debugging
6. ✓ All property-based tests pass with 100+ iterations
7. ✓ Integration tests pass end-to-end
8. ✓ No user-facing errors or delays
