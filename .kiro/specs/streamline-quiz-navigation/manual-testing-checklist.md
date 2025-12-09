# Manual Testing Checklist: Streamline Quiz Navigation

## Test Environment
- **Server URL**: http://localhost:7351/
- **Test Date**: December 9, 2024
- **Feature**: Streamline Quiz Navigation
- **Requirements Tested**: 1.1, 1.2, 1.4, 2.1, 2.4

## Test Scenarios

### Scenario 1: Practice Button Navigation from Subjects Page
**Requirement**: 1.1 - Direct navigation to quiz with practice mode

**Steps**:
1. Navigate to http://localhost:7351/subjects
2. Select any subject card
3. Click the "Practice" button
4. Observe the navigation flow

**Expected Results**:
- ✓ User should be redirected to `/quiz/practice?subject={slug}&year=ALL&type=ALL`
- ✓ LegacyQuizRedirect component should process the query parameters
- ✓ User should be redirected to `/quiz/unified` with the quiz interface loaded
- ✓ Quiz should display the correct subject name
- ✓ Quiz should be in practice mode (untimed, immediate feedback)
- ✓ No intermediate mode selection page should appear

**Test with Multiple Subjects**:
- [ ] Mathematics (JAMB)
- [ ] English (BOTH)
- [ ] Physics (JAMB)
- [ ] Biology (JAMB)
- [ ] Chemistry (JAMB)

---

### Scenario 2: Quiz Button Navigation from Subjects Page
**Requirement**: 1.2 - Direct navigation to quiz with exam mode

**Steps**:
1. Navigate to http://localhost:7351/subjects
2. Select any subject card
3. Click the "Quiz" button (green button)
4. Observe the navigation flow

**Expected Results**:
- ✓ User should be redirected to `/quiz/cbt?subject={slug}&year=ALL&type=ALL`
- ✓ LegacyQuizRedirect component should process the query parameters
- ✓ User should be redirected to `/quiz/unified` with the quiz interface loaded
- ✓ Quiz should display the correct subject name
- ✓ Quiz should be in exam mode (timed simulation)
- ✓ No intermediate mode selection page should appear

**Test with Multiple Subjects**:
- [ ] Mathematics (JAMB)
- [ ] English (BOTH)
- [ ] Physics (JAMB)
- [ ] Biology (JAMB)
- [ ] Chemistry (JAMB)

---

### Scenario 3: Verify Quiz Loads with Correct Configuration
**Requirement**: 1.4 - Quiz interface displays correct subject and mode

**Steps**:
1. Click Practice button for "Mathematics"
2. Once quiz loads, verify the interface shows:
   - Subject name: "Mathematics"
   - Mode indicator: Practice mode
   - Questions are loaded
3. Go back and click Quiz button for "English"
4. Once quiz loads, verify the interface shows:
   - Subject name: "English"
   - Mode indicator: Exam mode
   - Timer is visible (if applicable)

**Expected Results**:
- ✓ Subject name matches the selected subject
- ✓ Mode matches the button clicked (Practice vs Quiz)
- ✓ Questions are loaded and displayed
- ✓ Interface reflects the correct configuration

---

### Scenario 4: Mode Selection Page Direct Access
**Requirement**: 2.1, 2.4 - Mode selection page remains accessible

**Steps**:
1. Navigate directly to http://localhost:7351/quiz/mode-selection
2. Verify the full configuration wizard is displayed
3. Complete the wizard by selecting:
   - Exam type (JAMB or WAEC)
   - Quiz mode (Practice or Exam)
   - Subject
4. Click "Start Quiz"
5. Verify navigation to unified quiz

**Expected Results**:
- ✓ Mode selection page loads without issues
- ✓ All configuration options are available
- ✓ Wizard functions identically to previous implementation
- ✓ Successfully navigates to unified quiz after completion
- ✓ No regression in existing functionality

---

### Scenario 5: Test with Various Exam Types
**Requirement**: 1.1, 1.2 - Support for different exam types

**Steps**:
1. Test with JAMB-only subjects:
   - Click Practice on Mathematics
   - Verify quiz loads with JAMB questions
2. Test with WAEC-only subjects (if available):
   - Click Practice on a WAEC subject
   - Verify quiz loads with WAEC questions
3. Test with BOTH exam type subjects:
   - Click Practice on English
   - Verify quiz loads (should default to JAMB per design)

**Expected Results**:
- ✓ JAMB subjects load JAMB questions
- ✓ WAEC subjects load WAEC questions
- ✓ BOTH subjects default to JAMB questions
- ✓ Exam type is correctly determined and applied

---

### Scenario 6: Error Handling - Invalid Subject
**Requirement**: 3.4 - Fallback to mode selection on errors

**Steps**:
1. Manually navigate to http://localhost:7351/quiz/practice?subject=invalid-subject&year=ALL&type=ALL
2. Observe the behavior

**Expected Results**:
- ✓ LegacyQuizRedirect shows loading state briefly
- ✓ User is redirected to `/quiz/mode-selection`
- ✓ No error is displayed to the user (silent fallback)
- ✓ Mode selection page loads normally

---

### Scenario 7: Error Handling - Missing Subject Parameter
**Requirement**: 3.4 - Fallback to mode selection on missing parameters

**Steps**:
1. Manually navigate to http://localhost:7351/quiz/practice?year=ALL&type=ALL
2. Observe the behavior

**Expected Results**:
- ✓ LegacyQuizRedirect detects missing subject parameter
- ✓ User is redirected to `/quiz/mode-selection`
- ✓ No error is displayed to the user (silent fallback)
- ✓ Mode selection page loads normally

---

### Scenario 8: Query Parameter Preservation
**Requirement**: 1.3, 1.5 - Preserve query parameters through navigation

**Steps**:
1. Navigate to http://localhost:7351/quiz/practice?subject=mathematics&year=2023&type=JAMB
2. Verify the quiz loads with:
   - Subject: Mathematics
   - Year: 2023 (if year filtering is implemented)
   - Type: JAMB

**Expected Results**:
- ✓ All query parameters are preserved
- ✓ Quiz configuration reflects the parameters
- ✓ No parameters are lost during redirect

---

## Testing Summary

### Subjects Tested
- [ ] Mathematics
- [ ] English
- [ ] Physics
- [ ] Biology
- [ ] Chemistry
- [ ] (Add more as needed)

### Modes Tested
- [ ] Practice mode
- [ ] Exam mode

### Navigation Paths Tested
- [ ] Subjects page → Practice button → Quiz
- [ ] Subjects page → Quiz button → Quiz
- [ ] Direct access to mode selection page
- [ ] Legacy route with query parameters
- [ ] Error scenarios (invalid subject, missing parameters)

### Browser Compatibility (Optional)
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari
- [ ] Mobile browsers

---

## Issues Found

Document any issues discovered during testing:

1. **Issue**: [Description]
   - **Severity**: High/Medium/Low
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]

---

## Test Completion

**Tester**: [Your Name]
**Date**: [Date]
**Status**: ✓ Pass / ✗ Fail / ⚠ Partial

**Notes**:
[Any additional observations or comments]
