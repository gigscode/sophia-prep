# Manual Testing Instructions - Task 8

## ✅ Automated Verification Complete

The automated verification script has confirmed:
- ✅ Email normalization is working correctly
- ✅ Admin configuration is properly set up
- ✅ Admin user exists in auth.users table
- ✅ User profile exists in user_profiles table
- ✅ Last login timestamp is being tracked

## 📋 What You Need to Do

This task requires **manual testing** of the login functionality through the web interface. As an AI agent, I cannot interact with the browser UI directly, so you'll need to complete these steps.

### Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:7351/login
   ```

3. **Follow the test cases** below

## 🧪 Test Cases to Complete

### Test Case 1: Basic Login ✓
- [ ] Enter email: `reubensunday1220@gmail.com`
- [ ] Enter your password
- [ ] Click "Log In"
- [ ] **Expected**: Login succeeds, redirected to home page
- [ ] **Expected**: Console shows "Authentication successful"
- [ ] **Expected**: Console shows "Admin status check: true"

### Test Case 2: Case Variations ✓
Test these email variations (all should work):
- [ ] `REUBENSUNDAY1220@GMAIL.COM` (all uppercase)
- [ ] `ReubenSunday1220@Gmail.Com` (mixed case)
- [ ] `reubensunday1220@GMAIL.COM` (uppercase domain)
- [ ] **Expected**: All variations log in successfully

### Test Case 3: Whitespace Handling ✓
Test these email variations (all should work):
- [ ] `  reubensunday1220@gmail.com` (leading spaces)
- [ ] `reubensunday1220@gmail.com  ` (trailing spaces)
- [ ] `  reubensunday1220@gmail.com  ` (both)
- [ ] **Expected**: All variations log in successfully

### Test Case 4: Admin Features ✓
- [ ] After logging in, check if admin menu/features are visible
- [ ] Try accessing admin pages (if available in UI)
- [ ] **Expected**: Admin features are accessible
- [ ] **Expected**: No "unauthorized" errors

### Test Case 5: Database Verification ✓
- [ ] Open Supabase dashboard: https://app.supabase.com
- [ ] Navigate to Table Editor → user_profiles
- [ ] Search for your user
- [ ] **Expected**: Profile record exists with correct data

### Test Case 6: Last Login Updates ✓
- [ ] Note the current last_login timestamp in database
- [ ] Log out and log in again
- [ ] Check the last_login timestamp again
- [ ] **Expected**: Timestamp has been updated

### Test Case 7: Error Messages ✓
- [ ] Try logging in with wrong password
- [ ] **Expected**: Error message is "Invalid email or password"
- [ ] **Expected**: No sensitive data visible in console

### Test Case 8: Console Logging ✓
- [ ] Open browser console (F12)
- [ ] Clear console
- [ ] Attempt login
- [ ] **Expected**: See logs like:
  - "Login attempt for: reu***@gmail.com"
  - "Checking profile for user: reu***@gmail.com"
  - "Admin status check for reu***@gmail.com: true"
  - "Authentication successful"
- [ ] **Expected**: No passwords or tokens in logs
- [ ] **Expected**: Emails are redacted (reu***@gmail.com)

## 📚 Detailed Documentation

For more detailed instructions, see:
- **Comprehensive Guide**: `scripts/manual-testing-guide.md`
- **Summary Document**: `scripts/MANUAL_TESTING_SUMMARY.md`

## 🛠️ Optional: Interactive Testing Script

You can also run an interactive test script that automates some of the testing:

```bash
node scripts/test-admin-login.js
```

This will prompt you for credentials and test multiple email variations automatically.

## ✅ Success Criteria

All of the following must be true:
- ✅ reubensunday1220@gmail.com can log in successfully
- ✅ Login works with different email cases
- ✅ Login works with whitespace in email
- ✅ Admin features are accessible after login
- ✅ User profile exists in database
- ✅ Last login timestamp updates on each login
- ✅ Error messages are user-friendly
- ✅ Console logging is comprehensive
- ✅ No sensitive data in logs

## 🐛 Troubleshooting

### Server won't start
```bash
# Kill any process on port 7351
npx kill-port 7351
# Or use the provided batch file
KILL_PORT_7351.bat
```

### Can't connect to Supabase
- Check `.env.local` has correct credentials
- Verify Supabase project is running
- Check network connection

### Admin features not visible
- Check browser console for `isAdmin: true`
- Verify `VITE_ADMIN_EMAILS` in `.env.local`
- Clear browser cache and reload

## 📝 After Testing

Once you've completed all test cases:

1. **Document your results** (optional):
   - Take screenshots of successful login
   - Note any issues encountered
   - Verify all test cases passed

2. **Mark the task as complete**:
   - Update the task status in `.kiro/specs/admin-auth-fix/tasks.md`
   - Change `[-]` to `[x]` for task 8

3. **Proceed to next task**:
   - Task 9: Final checkpoint - Ensure all tests pass

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Check Supabase dashboard for database state
4. Review implementation in:
   - `src/hooks/useAuth.tsx`
   - `src/config/admin.ts`

---

**Requirements Validated**: 1.1, 5.2, 5.3
**Status**: Ready for manual testing
**Created**: December 2, 2025
