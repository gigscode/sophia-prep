# End-to-End Testing Guide: Streamline Quiz Navigation

## Overview

This guide provides instructions for manually testing the streamlined quiz navigation feature. The feature eliminates the need for users to re-select their quiz configuration when navigating from the subjects page.

## What Changed

### Before
```
Subjects Page → Click "Practice" → /quiz/practice
                                   ↓
                            Navigate redirect
                                   ↓
                            /quiz/mode-selection (loses params)
                                   ↓
                            User re-selects everything
                                   ↓
                            /quiz/unified
```

### After
```
Subjects Page → Click "Practice" → /quiz/practice?subject=X&year=ALL&type=ALL
                                   ↓
                            LegacyQuizRedirect (preserves params)
                                   ↓
                            /quiz/unified (direct navigation)
```

## Prerequisites

1. **Development Server Running**: Ensure the dev server is running at http://localhost:7351/
2. **Database Connection**: Verify Supabase connection is active
3. **Test Data**: Ensure subjects are seeded in the database

## Testing Instructions

### Quick Start Testing

1. **Open the application**: Navigate to http://localhost:7351/
2. **Go to Subjects page**: Click on "Subjects" in the navigation
3. **Test Practice button**: Click the blue "Practice" button on any subject
4. **Verify**: You should land directly on the quiz interface without seeing the mode selection page
5. **Test Quiz button**: Go back to subjects and click the green "Quiz" button
6. **Verify**: You should land directly on the quiz interface in exam mode

### Detailed Test Scenarios

#### Test 1: Practice Mode Navigation
**Purpose**: Verify direct navigation to practice mode quiz

1. Navigate to `/subjects`
2. Find "Mathematics" subject card
3. Click the blue "Practice" button
4. **Observe**:
   - URL changes to `/quiz/practice?subject=mathematics&year=ALL&type=ALL`
   - Brief loading screen appears
   - URL changes to `/quiz/unified`
   - Quiz interface loads with Mathematics questions
   - Practice mode is active (untimed, immediate feedback)

**Success Criteria**:
- ✓ No mode selection page appears
- ✓ Quiz loads with correct subject
- ✓ Practice mode is active
- ✓ Questions are displayed

#### Test 2: Exam Mode Navigation
**Purpose**: Verify direct navigation to exam mode quiz

1. Navigate to `/subjects`
2. Find "English" subject card
3. Click the green "Quiz" button
4. **Observe**:
   - URL changes to `/quiz/cbt?subject=english&year=ALL&type=ALL`
   - Brief loading screen appears
   - URL changes to `/quiz/unified`
   - Quiz interface loads with English questions
   - Exam mode is active (timed simulation)

**Success Criteria**:
- ✓ No mode selection page appears
- ✓ Quiz loads with correct subject
- ✓ Exam mode is active
- ✓ Timer is visible (if implemented)
- ✓ Questions are displayed

#### Test 3: Mode Selection Page Accessibility
**Purpose**: Verify mode selection page still works for manual configuration

1. Navigate directly to `/quiz/mode-selection`
2. **Observe**: Full configuration wizard is displayed
3. Select exam type (JAMB)
4. Select mode (Practice)
5. Select subject (Physics)
6. Click "Start Quiz"
7. **Observe**: Quiz loads with selected configuration

**Success Criteria**:
- ✓ Mode selection page loads correctly
- ✓ All options are available
- ✓ Wizard functions as before
- ✓ Quiz starts with correct configuration

#### Test 4: Multiple Subjects
**Purpose**: Verify feature works across different subjects

Test with at least 3 different subjects:
1. Mathematics (JAMB)
2. English (BOTH)
3. Physics (JAMB)

For each subject:
- Click Practice button → Verify correct subject loads
- Go back, click Quiz button → Verify correct subject loads in exam mode

**Success Criteria**:
- ✓ All subjects navigate correctly
- ✓ Subject names display correctly in quiz
- ✓ Questions match the selected subject

#### Test 5: Error Handling
**Purpose**: Verify graceful fallback for invalid scenarios

**Test 5a: Invalid Subject**
1. Manually navigate to: `http://localhost:7351/quiz/practice?subject=nonexistent&year=ALL&type=ALL`
2. **Observe**: Redirects to `/quiz/mode-selection`

**Test 5b: Missing Subject Parameter**
1. Manually navigate to: `http://localhost:7351/quiz/practice?year=ALL&type=ALL`
2. **Observe**: Redirects to `/quiz/mode-selection`

**Success Criteria**:
- ✓ Invalid scenarios redirect to mode selection
- ✓ No error messages displayed to user
- ✓ Mode selection page loads normally

#### Test 6: Exam Type Handling
**Purpose**: Verify correct exam type determination

1. **JAMB Subject**: Click Practice on Mathematics
   - Verify JAMB questions load
2. **BOTH Subject**: Click Practice on English
   - Verify questions load (should default to JAMB)
3. **WAEC Subject** (if available): Click Practice on a WAEC-only subject
   - Verify WAEC questions load

**Success Criteria**:
- ✓ Exam type is correctly determined
- ✓ Questions match the exam type
- ✓ BOTH subjects default to JAMB

## What to Look For

### Positive Indicators
- ✓ Smooth navigation without intermediate pages
- ✓ Correct subject displayed in quiz interface
- ✓ Correct mode (practice vs exam) is active
- ✓ Questions load successfully
- ✓ No console errors
- ✓ Loading states are brief and clear

### Red Flags
- ✗ Mode selection page appears when clicking Practice/Quiz buttons
- ✗ Wrong subject loads in quiz
- ✗ Wrong mode is active
- ✗ No questions load
- ✗ Console errors appear
- ✗ Infinite loading states
- ✗ Navigation loops

## Browser Testing

Test in multiple browsers to ensure compatibility:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)
- Mobile browsers (optional)

## Accessibility Testing

1. **Keyboard Navigation**: Tab through subjects page and activate buttons with Enter
2. **Screen Reader**: Verify loading states are announced
3. **Focus Management**: Verify focus moves appropriately during navigation

## Performance Testing

1. **Navigation Speed**: Time how long it takes from clicking Practice to quiz loading
   - Should be < 2 seconds on good connection
2. **Loading States**: Verify loading spinner appears during async operations
3. **Network Throttling**: Test with slow 3G to verify loading states work correctly

## Reporting Issues

If you find issues, document:
1. **What you did**: Exact steps to reproduce
2. **What you expected**: Expected behavior
3. **What happened**: Actual behavior
4. **Browser/Device**: Testing environment
5. **Screenshots**: If applicable
6. **Console errors**: Any errors in browser console

## Completion Checklist

- [ ] Tested Practice button navigation (3+ subjects)
- [ ] Tested Quiz button navigation (3+ subjects)
- [ ] Verified quiz loads with correct subject
- [ ] Verified quiz loads with correct mode
- [ ] Verified mode selection page is accessible
- [ ] Tested error scenarios (invalid subject, missing params)
- [ ] Tested with different exam types
- [ ] Tested in multiple browsers (optional)
- [ ] Verified no console errors
- [ ] Verified loading states work correctly

## Next Steps

After completing manual testing:
1. Document any issues found
2. Mark task as complete if all tests pass
3. Report any bugs or unexpected behavior
4. Consider writing automated integration tests for critical paths

## Notes

- This is a **manual testing task** - automated tests are marked as optional
- Focus on the **user experience** - does the flow feel smooth?
- The goal is to **eliminate unnecessary steps** in the quiz navigation
- Mode selection page should **still work** for users who want manual configuration

## Questions?

If you encounter unexpected behavior or have questions about expected functionality, refer to:
- Requirements document: `.kiro/specs/streamline-quiz-navigation/requirements.md`
- Design document: `.kiro/specs/streamline-quiz-navigation/design.md`
- Implementation: `src/components/quiz/LegacyQuizRedirect.tsx`
