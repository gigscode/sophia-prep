# Manual Testing Guide: Admin Authentication Fix

## Overview
This guide provides step-by-step instructions for manually testing the admin authentication fix for user reubensunday1220@gmail.com.

## Prerequisites
1. Development server must be running (`npm run dev`)
2. Supabase connection must be active
3. Admin user reubensunday1220@gmail.com must exist in auth.users table

## Test Cases

### Test Case 1: Login with Correct Email (Lowercase)
**Objective**: Verify that the admin user can log in with their email in lowercase

**Steps**:
1. Navigate to http://localhost:7351/login
2. Enter email: `reubensunday1220@gmail.com`
3. Enter the correct password
4. Click "Log In"

**Expected Results**:
- ✅ Login succeeds without errors
- ✅ User is redirected to home page
- ✅ Console shows: "Authentication successful for: reu***@gmail.com"
- ✅ Console shows: "Admin status check for reu***@gmail.com: true"
- ✅ Admin features are visible in the UI

**Requirements Validated**: 1.1, 5.2, 5.3

---

### Test Case 2: Login with Different Email Cases
**Objective**: Verify case-insensitive email matching

**Steps**:
1. Navigate to http://localhost:7351/login
2. Test each of these email variations:
   - `REUBENSUNDAY1220@GMAIL.COM` (all uppercase)
   - `ReubenSunday1220@Gmail.Com` (mixed case)
   - `reubensunday1220@GMAIL.COM` (uppercase domain)
3. Enter the correct password for each attempt
4. Click "Log In"

**Expected Results**:
- ✅ All variations log in successfully
- ✅ Email is normalized to lowercase before authentication
- ✅ Admin status is correctly identified for all variations
- ✅ Console shows normalized email in logs

**Requirements Validated**: 1.1, 1.2

---

### Test Case 3: Login with Whitespace in Email
**Objective**: Verify whitespace trimming

**Steps**:
1. Navigate to http://localhost:7351/login
2. Test each of these email variations:
   - `  reubensunday1220@gmail.com` (leading spaces)
   - `reubensunday1220@gmail.com  ` (trailing spaces)
   - `  reubensunday1220@gmail.com  ` (both)
3. Enter the correct password for each attempt
4. Click "Log In"

**Expected Results**:
- ✅ All variations log in successfully
- ✅ Whitespace is trimmed before authentication
- ✅ No authentication errors due to whitespace
- ✅ Console shows trimmed email in logs

**Requirements Validated**: 1.3

---

### Test Case 4: Verify Admin Features Accessibility
**Objective**: Confirm admin user has access to admin features

**Steps**:
1. Log in as reubensunday1220@gmail.com
2. Navigate to the admin section (if accessible via UI)
3. Check for admin-only features:
   - User management
   - Question management
   - Analytics dashboard
   - Subject management

**Expected Results**:
- ✅ Admin navigation/menu items are visible
- ✅ Admin pages are accessible
- ✅ No "unauthorized" or "access denied" errors
- ✅ User object has `isAdmin: true` property

**Requirements Validated**: 5.3

---

### Test Case 5: Verify User Profile Exists in Database
**Objective**: Confirm user_profiles record is created/exists

**Steps**:
1. Log in as reubensunday1220@gmail.com
2. Open Supabase dashboard
3. Navigate to Table Editor > user_profiles
4. Search for the user by email or ID

**Expected Results**:
- ✅ user_profiles record exists for the user
- ✅ email field matches: `reubensunday1220@gmail.com`
- ✅ is_active is `true`
- ✅ subscription_plan is set (default: 'Free')
- ✅ Console shows: "Profile exists for user: reu***@gmail.com" OR "Successfully created profile for user: reu***@gmail.com"

**Requirements Validated**: 2.1, 2.3, 5.1

---

### Test Case 6: Verify Last Login Timestamp Updates
**Objective**: Confirm last_login field updates on each login

**Steps**:
1. Note the current time
2. Log in as reubensunday1220@gmail.com
3. Open Supabase dashboard
4. Navigate to Table Editor > user_profiles
5. Check the last_login field for the user
6. Log out and log in again
7. Check the last_login field again

**Expected Results**:
- ✅ last_login timestamp is updated after first login
- ✅ last_login timestamp is updated again after second login
- ✅ Timestamps are close to actual login times
- ✅ No errors in console about last_login update

**Requirements Validated**: 5.2

---

### Test Case 7: Error Handling - Invalid Password
**Objective**: Verify error messages are user-friendly

**Steps**:
1. Navigate to http://localhost:7351/login
2. Enter email: `reubensunday1220@gmail.com`
3. Enter an incorrect password
4. Click "Log In"

**Expected Results**:
- ✅ Login fails with clear error message
- ✅ Error message is: "Invalid email or password"
- ✅ Console shows: "Authentication failed for reu***@gmail.com"
- ✅ No sensitive information (password) in console logs

**Requirements Validated**: 3.1, 6.4

---

### Test Case 8: Console Logging Verification
**Objective**: Verify comprehensive logging without sensitive data

**Steps**:
1. Open browser developer console (F12)
2. Clear console
3. Attempt to log in as reubensunday1220@gmail.com
4. Review all console messages

**Expected Results**:
- ✅ Console shows: "Login attempt for: reu***@gmail.com"
- ✅ Console shows: "Checking profile for user: reu***@gmail.com"
- ✅ Console shows: "Admin status check for reu***@gmail.com: true"
- ✅ Console shows: "Authentication successful for: reu***@gmail.com"
- ✅ No passwords visible in logs
- ✅ No authentication tokens visible in logs
- ✅ Email addresses are redacted (first 3 chars + ***)

**Requirements Validated**: 6.1, 6.2, 6.3, 6.4

---

## Automated Verification Script

Run the automated verification script to check database state:
```bash
node scripts/verify-admin-auth.js
```

This script will:
- Check if admin user exists in auth.users
- Verify user_profiles record exists
- Check admin configuration
- Validate email normalization

---

## Troubleshooting

### Issue: "Invalid email or password" error
**Solution**: 
- Verify the password is correct
- Check that the user exists in Supabase auth.users table
- Ensure Supabase connection is active

### Issue: Profile not found in database
**Solution**:
- Run: `node scripts/ensure-admin-profiles.js`
- Check Supabase RLS policies allow profile creation
- Verify database trigger `handle_new_user()` is active

### Issue: Admin features not visible
**Solution**:
- Check browser console for `isAdmin: true` in user object
- Verify email is in admin configuration (src/config/admin.ts)
- Check VITE_ADMIN_EMAILS environment variable

### Issue: Last login not updating
**Solution**:
- Check Supabase RLS policies allow profile updates
- Review console for update errors
- Verify user_profiles table has last_login column

---

## Success Criteria Checklist

- [ ] reubensunday1220@gmail.com can log in successfully
- [ ] Login works with different email cases
- [ ] Login works with whitespace in email
- [ ] Admin features are accessible after login
- [ ] User profile exists in database
- [ ] Last login timestamp updates on each login
- [ ] Error messages are user-friendly
- [ ] Console logging is comprehensive
- [ ] No sensitive data in logs
- [ ] All requirements (1.1, 5.2, 5.3) are validated

---

## Notes

- This is a **manual testing** task that requires human interaction
- Automated tests cover unit and property-based testing
- Manual testing validates the complete user experience
- Document any issues found during testing
- Take screenshots of successful login flows for documentation
