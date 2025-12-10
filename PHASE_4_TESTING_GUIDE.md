# Phase 4 Testing Guide: CBT Exam with Class Categories

## 🧪 Testing Checklist

### 1. Navigation Flow Testing

#### Test 1.1: Access CBT Exam Menu
- [ ] Navigate to home page
- [ ] Click "CBT Exam" in bottom navigation
- [ ] Verify page title is "CBT Exam Simulation"
- [ ] Verify description mentions "real JAMB/WAEC exam conditions"

#### Test 1.2: Exam Type Selection
- [ ] Verify two exam type cards are displayed: JAMB and WAEC
- [ ] Click JAMB card
- [ ] Verify navigation to class category selection page
- [ ] Go back and click WAEC card
- [ ] Verify navigation to class category selection page

---

### 2. Class Category Selection Testing

#### Test 2.1: Category Display
- [ ] On class category page, verify three categories are shown:
  - Science (blue theme)
  - Arts (purple theme)
  - Commercial (green theme)
- [ ] Verify each category shows subject count
- [ ] Verify each category shows subject descriptions

#### Test 2.2: Science Category
- [ ] Click Science category
- [ ] Verify navigation to UnifiedQuiz
- [ ] Verify questions load from multiple subjects
- [ ] Verify subject badges appear on questions
- [ ] Verify subjects include: English, Mathematics, Physics, Chemistry, Biology

#### Test 2.3: Arts Category
- [ ] Go back to category selection
- [ ] Click Arts category
- [ ] Verify questions load from Arts subjects
- [ ] Verify subjects include: English, Mathematics, Literature, Government, etc.

#### Test 2.4: Commercial Category
- [ ] Go back to category selection
- [ ] Click Commercial category
- [ ] Verify questions load from Commercial subjects
- [ ] Verify subjects include: English, Mathematics, Economics, Commerce, Accounting

---

### 3. Multi-Subject Quiz Testing

#### Test 3.1: Question Loading
- [ ] Start a category-based quiz
- [ ] Verify questions load successfully
- [ ] Verify loading spinner appears while loading
- [ ] Verify no error messages appear
- [ ] Verify question count is appropriate (e.g., 160+ for JAMB Science)

#### Test 3.2: Subject Badges
- [ ] Verify each question shows a subject badge
- [ ] Verify badge displays correct subject name
- [ ] Verify badge styling (blue background, rounded)
- [ ] Verify badge is visible and readable

#### Test 3.3: Question Distribution
- [ ] Navigate through several questions
- [ ] Verify questions come from different subjects
- [ ] Verify subjects are mixed (not all from one subject)
- [ ] Verify each subject has roughly equal representation

---

### 4. Timer Testing

#### Test 4.1: Full Exam Time (JAMB)
- [ ] Start JAMB Science category quiz
- [ ] Verify timer shows 2:30:00 (2.5 hours)
- [ ] Verify timer info banner shows total time
- [ ] Verify time per question calculation is displayed

#### Test 4.2: Full Exam Time (WAEC)
- [ ] Start WAEC Science category quiz
- [ ] Verify timer shows 3:00:00 (3 hours)
- [ ] Verify timer info banner shows total time
- [ ] Verify time per question calculation is displayed

#### Test 4.3: Timer Countdown
- [ ] Verify timer counts down correctly
- [ ] Verify timer turns red when < 5 minutes remaining
- [ ] Wait for timer to expire (or modify timer for testing)
- [ ] Verify quiz auto-submits when timer reaches 0

---

### 5. Quiz Functionality Testing

#### Test 5.1: Answer Selection
- [ ] Click on an answer option
- [ ] Verify option is highlighted
- [ ] Navigate to next question
- [ ] Go back to previous question
- [ ] Verify selected answer is preserved

#### Test 5.2: Navigation
- [ ] Use "Next" button to navigate forward
- [ ] Use "Previous" button to navigate backward
- [ ] Verify progress bar updates correctly
- [ ] Verify question counter updates (e.g., "Question 5 of 160")

#### Test 5.3: Quiz Completion
- [ ] Answer all questions (or skip to last question)
- [ ] Click "Submit Quiz" button
- [ ] Verify navigation to results page
- [ ] Verify results show correct score
- [ ] Verify results show total questions

---

### 6. Error Handling Testing

#### Test 6.1: No Subjects Available
- [ ] If a category has no subjects, verify:
  - Category card shows "No subjects available"
  - Category card is disabled
  - Clicking shows appropriate error message

#### Test 6.2: No Questions Available
- [ ] If no questions exist for selected subjects:
  - Verify error message is displayed
  - Verify error message is clear and helpful
  - Verify "Back to Mode Selection" button works

#### Test 6.3: Invalid Configuration
- [ ] Try accessing `/quiz/unified` without config
- [ ] Verify redirect to quiz mode selection
- [ ] Verify no crash or blank page

---

### 7. Responsive Design Testing

#### Test 7.1: Mobile View (< 768px)
- [ ] Test on mobile device or resize browser
- [ ] Verify category cards stack vertically
- [ ] Verify subject badges are readable
- [ ] Verify timer is visible
- [ ] Verify navigation buttons are accessible

#### Test 7.2: Tablet View (768px - 1024px)
- [ ] Verify category cards display in grid
- [ ] Verify all content is readable
- [ ] Verify no horizontal scrolling

#### Test 7.3: Desktop View (> 1024px)
- [ ] Verify category cards display in 3-column grid
- [ ] Verify optimal spacing and layout
- [ ] Verify all interactive elements are accessible

---

### 8. Accessibility Testing

#### Test 8.1: Keyboard Navigation
- [ ] Use Tab key to navigate through category cards
- [ ] Use Enter/Space to select category
- [ ] Verify focus indicators are visible
- [ ] Verify all interactive elements are reachable

#### Test 8.2: Screen Reader
- [ ] Test with screen reader (if available)
- [ ] Verify category names are announced
- [ ] Verify subject counts are announced
- [ ] Verify subject badges are announced

---

### 9. State Persistence Testing

#### Test 9.1: Quiz State Saving
- [ ] Start a category-based quiz
- [ ] Answer a few questions
- [ ] Refresh the page
- [ ] Verify quiz state is restored
- [ ] Verify answers are preserved
- [ ] Verify current question index is preserved

#### Test 9.2: Timer Persistence
- [ ] Start a quiz with timer
- [ ] Wait a few seconds
- [ ] Refresh the page
- [ ] Verify timer resumes from correct time

---

### 10. Integration Testing

#### Test 10.1: Subject Menu Flow (Comparison)
- [ ] Navigate to Subjects page
- [ ] Click "Practice" button on a subject
- [ ] Verify single-subject quiz loads
- [ ] Verify NO subject badge appears (single subject)
- [ ] Verify proportional timing is used

#### Test 10.2: CBT Exam Flow
- [ ] Navigate to CBT Exam menu
- [ ] Select exam type and category
- [ ] Verify multi-subject quiz loads
- [ ] Verify subject badges appear
- [ ] Verify full exam timing is used

---

## 🐛 Known Issues to Watch For

1. **Subject Availability**: Some categories may have no subjects if database is not fully populated
2. **Question Count**: Ensure database has enough questions per subject (40+ recommended)
3. **Timer Accuracy**: Verify timer doesn't drift over long periods
4. **Memory Usage**: Monitor for memory leaks during long quiz sessions

---

## ✅ Success Criteria

Phase 4 is considered successful if:
- ✅ All three class categories are selectable
- ✅ Multi-subject questions load correctly
- ✅ Subject badges display on all questions
- ✅ Full exam timing works correctly
- ✅ Navigation flow is smooth and intuitive
- ✅ No TypeScript errors or console warnings
- ✅ Responsive design works on all screen sizes
- ✅ Quiz state persists across page refreshes

---

## 📝 Testing Notes

**Date**: _____________

**Tester**: _____________

**Browser**: _____________

**Device**: _____________

**Issues Found**:
- 
- 
- 

**Additional Comments**:
- 
- 
- 

---

## 🚀 Next Steps After Testing

1. Fix any bugs found during testing
2. Optimize performance if needed
3. Add analytics tracking for category selection
4. Consider adding per-subject score breakdown in results
5. Deploy to production!

