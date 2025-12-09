# Manual Testing Instructions - Task 5

## Overview

Task 5 requires **manual testing** of the end-to-end navigation flows for the streamlined quiz navigation feature. This document provides clear instructions on what you need to test.

## Quick Start

1. **Server is Running**: The development server is already running at http://localhost:7351/
2. **Open the App**: Navigate to http://localhost:7351/ in your browser
3. **Follow the Test Scenarios**: See below for what to test

---

## What to Test

### Test 1: Practice Button (Most Important) ⭐

**Steps**:
1. Go to http://localhost:7351/subjects
2. Find any subject (e.g., "Mathematics")
3. Click the blue **"Practice"** button

**What Should Happen**:
- ✓ You should see a brief loading screen
- ✓ You should land directly on the quiz interface
- ✓ The quiz should show Mathematics questions
- ✓ You should be in practice mode (untimed)
- ✓ **You should NOT see the mode selection page**

**If This Works**: The core feature is working! ✓

---

### Test 2: Quiz Button (Most Important) ⭐

**Steps**:
1. Go to http://localhost:7351/subjects
2. Find any subject (e.g., "English")
3. Click the green **"Quiz"** button

**What Should Happen**:
- ✓ You should see a brief loading screen
- ✓ You should land directly on the quiz interface
- ✓ The quiz should show English questions
- ✓ You should be in exam mode (timed)
- ✓ **You should NOT see the mode selection page**

**If This Works**: The core feature is working! ✓

---

### Test 3: Mode Selection Still Works

**Steps**:
1. Go directly to http://localhost:7351/quiz/mode-selection
2. You should see the full configuration wizard
3. Select options and start a quiz

**What Should Happen**:
- ✓ Mode selection page loads normally
- ✓ All options are available
- ✓ Quiz starts after completing the wizard

**If This Works**: Backward compatibility is maintained! ✓

---

### Test 4: Try Multiple Subjects

**Steps**:
1. Go to http://localhost:7351/subjects
2. Click Practice on **3 different subjects**
3. Verify each one loads correctly

**Subjects to Try**:
- Mathematics
- English
- Physics
- Biology
- Chemistry

**What Should Happen**:
- ✓ Each subject loads its own questions
- ✓ Subject name is displayed correctly
- ✓ No mode selection page appears

---

### Test 5: Error Handling (Optional)

**Steps**:
1. Manually type this URL: http://localhost:7351/quiz/practice?subject=invalid&year=ALL&type=ALL
2. Press Enter

**What Should Happen**:
- ✓ You should be redirected to the mode selection page
- ✓ No error message should appear
- ✓ Mode selection page should work normally

---

## How to Report Results

### If Everything Works ✓

Great! The feature is working as expected. You can:
1. Mark the task as complete
2. Move on to the next task or checkpoint

### If Something Doesn't Work ✗

Please note:
1. **What you did**: Which button you clicked, which subject
2. **What you expected**: What should have happened
3. **What actually happened**: What you saw instead
4. **Any error messages**: Check the browser console (F12)

---

## Key Success Criteria

The feature is working correctly if:

1. ✓ **Practice button** → Goes directly to quiz (no mode selection page)
2. ✓ **Quiz button** → Goes directly to quiz (no mode selection page)
3. ✓ **Correct subject** loads in the quiz
4. ✓ **Correct mode** is active (practice vs exam)
5. ✓ **Mode selection page** still works when accessed directly

---

## Common Issues and Solutions

### Issue: Mode selection page still appears
**Possible Cause**: Browser cache
**Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Quiz doesn't load
**Possible Cause**: No questions in database for that subject
**Solution**: Try a different subject (Mathematics or English usually have questions)

### Issue: Console errors
**Possible Cause**: Implementation issue
**Solution**: Check browser console (F12) and report the error

---

## Time Estimate

- **Minimum Testing**: 5-10 minutes (Tests 1-3)
- **Thorough Testing**: 15-20 minutes (All tests)

---

## Additional Resources

If you want more detailed testing instructions, see:
- **Detailed Guide**: `TESTING_GUIDE.md` - Comprehensive testing instructions
- **Checklist**: `manual-testing-checklist.md` - Detailed checklist with all scenarios
- **Verification Report**: `verify-implementation.md` - Implementation status and code review

---

## Questions?

If you're unsure about expected behavior:
1. Check the requirements: `requirements.md`
2. Check the design: `design.md`
3. Ask for clarification

---

## Ready to Test?

1. Open http://localhost:7351/subjects
2. Click a Practice button
3. Verify you go directly to the quiz
4. That's it! The core feature is working if this works.

**Good luck with testing!** 🚀
