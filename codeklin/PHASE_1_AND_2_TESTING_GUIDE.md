# Phase 1 & 2 Testing Guide
## How to Test the New Workflow Changes

**Date:** 2025-12-10

---

## 🧪 Phase 1 Testing: "CBT Exam" Rename

### Test 1: Quiz Page Title
**Steps:**
1. Navigate to `/quiz` in your browser
2. Check the page title

**Expected Result:**
- ✅ Page title should say "CBT Exam" (not "Quiz Modes")
- ✅ Subtitle should say "CBT Exam Simulation"
- ✅ Description should mention "computer-based test simulating real JAMB/WAEC exam conditions"

---

### Test 2: Bottom Navigation
**Steps:**
1. Look at the bottom navigation bar
2. Find the quiz/exam navigation item

**Expected Result:**
- ✅ Label should say "CBT Exam" (not "Quiz")
- ✅ Icon should be ClipboardList
- ✅ Clicking it should navigate to `/quiz`

---

### Test 3: Home Page Section
**Steps:**
1. Navigate to home page `/`
2. Scroll to quiz modes section

**Expected Result:**
- ✅ Section title should say "CBT Exam Modes" (not "Quiz Modes")
- ✅ Two cards should be visible: "Practice Mode" and "CBT Quiz"

---

## 🧪 Phase 2 Testing: Subject Card Buttons

### Test 4: Subject Cards Display
**Steps:**
1. Navigate to `/subjects`
2. Look at any subject card

**Expected Result:**
- ✅ Each subject card should have TWO buttons at the bottom:
  - Blue "Practice" button with BookOpen icon
  - Green "Quiz" button with Clock icon
- ✅ Buttons should be side-by-side
- ✅ Hovering should show darker color

---

### Test 5: Practice Button - Year Modal
**Steps:**
1. On `/subjects` page, click the blue "Practice" button on any subject (e.g., Mathematics)
2. Observe the modal that appears

**Expected Result:**
- ✅ Modal should open with title "Select Year"
- ✅ Subtitle should show: "{Subject Name} - {Exam Type} Practice"
- ✅ "All Years" option should be visible with blue styling
- ✅ Specific years should be displayed in a grid (if available)
- ✅ Loading spinner should appear briefly while fetching years

---

### Test 6: Quiz Button - Year Modal
**Steps:**
1. On `/subjects` page, click the green "Quiz" button on any subject
2. Observe the modal that appears

**Expected Result:**
- ✅ Modal should open with title "Select Year"
- ✅ Subtitle should show: "{Subject Name} - {Exam Type} Quiz"
- ✅ "All Years" option should be visible with green styling
- ✅ Specific years should be displayed in a grid (if available)

---

### Test 7: Year Selection - All Years
**Steps:**
1. Click "Practice" button on Mathematics
2. In the modal, click "All Years"

**Expected Result:**
- ✅ Modal should close
- ✅ Should navigate to `/quiz/unified`
- ✅ Quiz should load with questions from all available years
- ✅ Questions should be from the selected subject (Mathematics)
- ✅ Should be in practice mode (untimed, immediate feedback)

---

### Test 8: Year Selection - Specific Year
**Steps:**
1. Click "Practice" button on Mathematics
2. In the modal, click a specific year (e.g., 2023)

**Expected Result:**
- ✅ Modal should close
- ✅ Should navigate to `/quiz/unified`
- ✅ Quiz should load with questions from 2023 only
- ✅ Questions should be from the selected subject (Mathematics)
- ✅ Should be in practice mode (untimed, immediate feedback)

---

### Test 9: Quiz Mode (Timed)
**Steps:**
1. Click "Quiz" button on Mathematics
2. Select "All Years" or a specific year

**Expected Result:**
- ✅ Modal should close
- ✅ Should navigate to `/quiz/unified`
- ✅ Quiz should load in exam mode (timed)
- ✅ Timer should be visible at the top
- ✅ No immediate feedback after answering questions
- ✅ Feedback shown only after submission

---

### Test 10: Modal Close Button
**Steps:**
1. Click "Practice" button on any subject
2. Click the X button in the top-right of the modal

**Expected Result:**
- ✅ Modal should close
- ✅ Should remain on `/subjects` page
- ✅ No navigation should occur

---

### Test 11: Subject with BOTH Exam Types
**Steps:**
1. Find a subject that supports both JAMB and WAEC (exam_type = 'BOTH')
2. Click "Practice" button

**Expected Result:**
- ✅ Modal should open
- ✅ Should default to JAMB exam type
- ✅ Years displayed should be for JAMB

**Note:** In future phases, we may add exam type selection for subjects that support both.

---

### Test 12: Subject with No Questions
**Steps:**
1. Find a subject with no questions in the database
2. Click "Practice" button

**Expected Result:**
- ✅ Modal should open
- ✅ Loading spinner should appear
- ✅ After loading, should show "No questions available" message
- ✅ Should suggest trying "All Years" or different exam type

---

### Test 13: Mobile Responsiveness
**Steps:**
1. Open browser DevTools (F12)
2. Switch to mobile view (iPhone or Android)
3. Navigate to `/subjects`
4. Click "Practice" button on any subject

**Expected Result:**
- ✅ Subject cards should stack vertically
- ✅ Practice and Quiz buttons should be visible and clickable
- ✅ Modal should be responsive and fit screen
- ✅ Year grid should adjust to mobile width
- ✅ All text should be readable

---

### Test 14: Navigation Flow Comparison

**Old Flow (Before):**
1. Click subject card → 
2. Redirected to mode selection → 
3. Select exam type → 
4. Select mode → 
5. Select method → 
6. Select subject/year → 
7. Start quiz

**Total:** 8 clicks, ~45 seconds

**New Flow (After):**
1. Click "Practice" or "Quiz" button on subject card → 
2. Select year → 
3. Start quiz

**Total:** 3 clicks, ~15 seconds

**Expected Result:**
- ✅ New flow should be significantly faster
- ✅ New flow should feel more intuitive
- ✅ Users should understand what each button does

---

## 🐛 Common Issues to Check

### Issue 1: Modal Not Opening
**Symptoms:** Clicking Practice/Quiz button does nothing

**Check:**
- Browser console for errors
- Verify `YearSelectionModal` component is imported
- Verify state is being set correctly

---

### Issue 2: No Years Displayed
**Symptoms:** Modal opens but shows "No questions available"

**Possible Causes:**
- Subject has no questions in database
- Questions don't have `exam_year` set
- Questions don't have `subject_id` set (run migration if needed)

**Solution:**
- Run `FIX_QUESTIONS_MIGRATION.sql` if not already done
- Verify questions exist for the subject

---

### Issue 3: Navigation Doesn't Work
**Symptoms:** Selecting year doesn't navigate to quiz

**Check:**
- Browser console for errors
- Verify `navigate()` is being called
- Verify state is being passed correctly
- Check `/quiz/unified` route exists in App.tsx

---

### Issue 4: Questions Don't Load
**Symptoms:** Quiz page loads but no questions appear

**Check:**
- Browser console for errors
- Verify `question-service.ts` is working
- Check if questions have `subject_id` set
- Verify fallback query logic is working

---

## ✅ Success Criteria

### Phase 1:
- [ ] All "Quiz Modes" references changed to "CBT Exam"
- [ ] Bottom navigation shows "CBT Exam"
- [ ] Home page shows "CBT Exam Modes"
- [ ] No broken links or errors

### Phase 2:
- [ ] Subject cards show Practice and Quiz buttons
- [ ] Clicking buttons opens year selection modal
- [ ] Modal displays available years correctly
- [ ] Selecting year navigates to quiz
- [ ] Questions load correctly
- [ ] Practice mode works (untimed, immediate feedback)
- [ ] Quiz mode works (timed, end feedback)
- [ ] Mobile responsive
- [ ] No TypeScript errors
- [ ] No console errors

---

## 📊 Performance Metrics to Track

1. **Click Reduction:** Old flow (8 clicks) vs New flow (3 clicks)
2. **Time to Quiz:** Old flow (~45s) vs New flow (~15s)
3. **User Preference:** % using new buttons vs old navigation
4. **Error Rate:** Failed quiz loads or navigation errors
5. **Completion Rate:** % of started quizzes that are completed

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - Mark Phase 1 & 2 as complete
   - Gather user feedback
   - Plan Phase 3 (Proportional Timing)

2. **If issues found:**
   - Document issues in detail
   - Fix critical bugs
   - Re-test
   - Deploy fixes

3. **User Feedback:**
   - Ask users: "Is the new navigation clearer?"
   - Ask users: "Do you understand the difference between Practice and Quiz?"
   - Track analytics on button usage

---

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for errors
2. Verify database migration was run
3. Check that dev server is running
4. Review implementation summary document
5. Contact development team with specific error messages

---

**Happy Testing! 🎉**

