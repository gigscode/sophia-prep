# Design Document: Admin Authentication Fix

## Overview

This design addresses the authentication failure for admin user reubensunday1220@gmail.com by implementing robust email normalization, automatic profile creation, improved error handling, and centralized admin configuration. The solution ensures that admin users can reliably log in regardless of email casing and that user profiles are automatically created and maintained.

## Architecture

### Current System Issues

1. **Case Sensitivity**: Email comparison uses exact string matching without normalization
2. **Missing Profile Handling**: No fallback when user_profiles record doesn't exist
3. **Silent Failures**: Profile update errors block login without clear messaging
4. **Hardcoded Configuration**: Admin emails are hardcoded in the useAuth hook

### Proposed Architecture

```
┌─────────────────┐
│   Login Page    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      useAuth Hook (Enhanced)        │
│  - Email normalization              │
│  - Profile creation/verification    │
│  - Error categorization             │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│    Supabase Auth + Database         │
│  - auth.users table                 │
│  - user_profiles table              │
│  - RLS policies                     │
└─────────────────────────────────────┘
```

## Components and Interfaces

### 1. Admin Configuration Module

**Location**: `src/config/admin.ts`

**Purpose**: Centralize admin email management

**Interface**:
```typescript
export interface AdminConfig {
  emails: Set<string>;
  isAdmin: (email: string) => boolean;
}

export const adminConfig: AdminConfig;
```

**Responsibilities**:
- Store admin emails in normalized (lowercase) format
- Provide case-insensitive admin status checking
- Support environment variable configuration

### 2. Enhanced useAuth Hook

**Location**: `src/hooks/useAuth.tsx`

**Modifications**:
- Import admin configuration from centralized module
- Normalize emails before comparison
- Implement profile creation fallback
- Add detailed error logging
- Categorize errors for user-friendly messages

**Key Functions**:

```typescript
// Normalize email for consistent comparison
const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Ensure user profile exists, create if missing
const ensureUserProfile = async (supabaseUser: any): Promise<void> => {
  // Check if profile exists
  // If not, create with default values
  // Handle errors gracefully
};

// Enhanced mapUser with profile verification
const mapUser = async (supabaseUser: any): Promise<User> => {
  const normalizedEmail = normalizeEmail(supabaseUser.email || '');
  const isAdmin = adminConfig.isAdmin(normalizedEmail);
  
  // Ensure profile exists
  await ensureUserProfile(supabaseUser);
  
  // Update last_login (non-blocking)
  // Return user object
};
```

### 3. Error Handling Enhancement

**Location**: `src/hooks/useAuth.tsx` and `src/pages/LoginPage.tsx`

**Error Categories**:
- **AuthError**: Invalid credentials
- **NetworkError**: Connection issues
- **DatabaseError**: Profile/database operations
- **UnknownError**: Unexpected failures

**Implementation**:
```typescript
const categorizeError = (error: any): string => {
  if (error.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your connection';
  }
  if (error.message?.includes('database') || error.message?.includes('relation')) {
    return 'System error. Please try again later';
  }
  return 'An unexpected error occurred. Please try again';
};
```

### 4. Database Migration Script

**Location**: `scripts/ensure-admin-profiles.js`

**Purpose**: Verify and create missing admin user profiles

**Functionality**:
- Check if admin users exist in auth.users
- Verify corresponding user_profiles records
- Create missing profiles with admin metadata
- Report status for each admin user

## Data Models

### User Profile Model (Enhanced)

```typescript
interface UserProfile {
  id: string;              // UUID matching auth.users.id
  email: string;           // Normalized email
  full_name: string | null;
  phone_number: string | null;
  exam_type: 'JAMB' | 'WAEC' | 'BOTH' | null;
  target_exam_date: Date | null;
  preferred_subjects: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;      // Default: true
  last_login: Date | null; // Updated on each login
  subscription_plan: string; // Default: 'Free'
  created_at: Date;
  updated_at: Date;
}
```

### Admin Configuration Model

```typescript
interface AdminConfig {
  emails: Set<string>;     // Normalized admin emails
  isAdmin: (email: string) => boolean;
}
```

## Co
rrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email normalization is idempotent

*For any* email string, normalizing it multiple times should produce the same result as normalizing it once. That is, `normalize(normalize(email)) === normalize(email)`.
**Validates: Requirements 1.2**

### Property 2: Email normalization produces lowercase output

*For any* email string, the normalized output should contain no uppercase characters.
**Validates: Requirements 1.2**

### Property 3: Whitespace trimming is consistent

*For any* email string with leading or trailing whitespace, normalization should remove all such whitespace, and the result should equal the normalization of the trimmed string.
**Validates: Requirements 1.3**

### Property 4: Admin status check is case-insensitive

*For any* admin email in the configuration, checking admin status with any case variation of that email should return true.
**Validates: Requirements 1.1, 4.2**

### Property 5: Sensitive data is never logged

*For any* log message generated by the authentication system, it should not contain password strings or authentication tokens.
**Validates: Requirements 6.4**

## Error Handling

### Error Categories and Responses

1. **Invalid Credentials**
   - Supabase error: "Invalid login credentials"
   - User message: "Invalid email or password"
   - Action: Display error, allow retry

2. **Network Errors**
   - Indicators: "network", "fetch", "timeout" in error message
   - User message: "Network error. Please check your connection"
   - Action: Display error, suggest checking connection

3. **Database Errors**
   - Indicators: "database", "relation", "column" in error message
   - User message: "System error. Please try again later"
   - Action: Log detailed error, display generic message

4. **Profile Operation Failures**
   - Context: Profile creation or update fails
   - User impact: None (login proceeds)
   - Action: Log error, continue authentication flow

### Error Handling Strategy

```typescript
try {
  // Attempt authentication
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  
  if (error) throw error;
  
  // Attempt profile operations (non-blocking)
  try {
    await ensureUserProfile(data.user);
    await updateLastLogin(data.user.id);
  } catch (profileError) {
    console.error('Profile operation failed:', profileError);
    // Continue with login
  }
  
  return mapUser(data.user);
} catch (error) {
  const userMessage = categorizeError(error);
  showToast(userMessage, 'error');
  throw error;
}
```

### Logging Strategy

- **Authentication failures**: Log error type and sanitized email (no password)
- **Profile operations**: Log user ID and operation type
- **Admin checks**: Log normalized email being checked
- **Sensitive data**: Never log passwords, tokens, or session data

## Testing Strategy

### Unit Testing

We will use Vitest for unit testing the following components:

1. **Email Normalization**
   - Test lowercase conversion
   - Test whitespace trimming
   - Test empty string handling
   - Test null/undefined handling

2. **Admin Configuration**
   - Test isAdmin with various email formats
   - Test case-insensitive matching
   - Test environment variable loading

3. **Error Categorization**
   - Test each error type maps to correct message
   - Test unknown errors get generic message

4. **Profile Operations**
   - Test ensureUserProfile creates missing profiles
   - Test ensureUserProfile handles existing profiles
   - Test error handling doesn't block login

### Property-Based Testing

We will use fast-check (JavaScript property-based testing library) for testing universal properties:

1. **Email Normalization Properties**
   - Idempotence: `normalize(normalize(x)) === normalize(x)`
   - Lowercase output: No uppercase characters in result
   - Whitespace handling: Leading/trailing spaces removed

2. **Admin Status Properties**
   - Case insensitivity: All case variations of admin emails return true
   - Non-admin emails: Random non-admin emails return false

3. **Logging Properties**
   - No sensitive data: Log messages never contain passwords or tokens

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test will include a comment explicitly referencing the correctness property from this design document using the format: `// Feature: admin-auth-fix, Property {number}: {property_text}`

### Integration Testing

1. **Full Login Flow**
   - Test successful admin login
   - Test successful regular user login
   - Test failed login with invalid credentials
   - Test profile creation during login

2. **Database Integration**
   - Test profile creation in actual database
   - Test last_login timestamp updates
   - Test RLS policies don't block operations

### Manual Testing Checklist

1. Log in as reubensunday1220@gmail.com with correct password
2. Log in with email in different cases (REUBENSUNDAY1220@GMAIL.COM)
3. Log in with email with extra spaces
4. Verify admin features are accessible
5. Check database for user_profiles record
6. Verify last_login timestamp updates

## Implementation Notes

### Admin Email Configuration Priority

1. Environment variables (highest priority)
2. Hardcoded defaults (fallback)

### Profile Creation Timing

- **On signup**: Handled by database trigger
- **On login**: Fallback check and creation if missing
- **Non-blocking**: Profile operations never prevent login

### Database Trigger Enhancement

The existing `handle_new_user()` trigger should be verified to ensure it:
- Creates user_profiles record on signup
- Populates email field
- Sets default values for all fields

### RLS Policy Verification

Ensure the following policies exist and are correct:
- Users can insert their own profile
- Users can update their own profile
- Users can select their own profile
- Admins can select all profiles

## Security Considerations

1. **Email Normalization**: Prevents bypass through case variations
2. **Admin List**: Centralized and version-controlled
3. **Error Messages**: Generic messages prevent information leakage
4. **Logging**: Sensitive data is never logged
5. **RLS Policies**: Database-level security enforced

## Performance Considerations

1. **Profile Operations**: Non-blocking to avoid login delays
2. **Admin Check**: O(1) lookup using Set data structure
3. **Email Normalization**: Minimal overhead (lowercase + trim)
4. **Caching**: Admin config loaded once at initialization

## Deployment Steps

1. Deploy admin configuration module
2. Update useAuth hook with enhancements
3. Run admin profile verification script
4. Verify database triggers are active
5. Test admin login functionality
6. Monitor logs for any issues

## Rollback Plan

If issues occur:
1. Revert useAuth hook changes
2. Restore previous admin email checking logic
3. Investigate and fix issues
4. Redeploy with fixes

## Success Criteria

- reubensunday1220@gmail.com can log in successfully
- Admin features are accessible after login
- User profile exists in database
- Last_login timestamp updates on each login
- No authentication errors in logs
- All tests pass
