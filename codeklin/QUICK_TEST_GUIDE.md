# Quick Test Guide - Quiz Fixes

## Prerequisites
Before testing, you MUST run the database migration to add the `subject_id` column:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `FIX_QUESTIONS_MIGRATION.sql`
4. Click "Run"
5. Verify the output shows questions were updated

---

## Test 1: Duplicate Mode Selection Fix

### Steps:
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:7351/quiz`
3. Click on "Practice Mode" card

### Expected Result:
✅ You should be taken directly to the **Exam Type Selection** page (JAMB/WAEC)
✅ You should NOT see a mode selection page again

### Flow Should Be:
```
Quiz Menu → Exam Type (JAMB/WAEC) → Selection Method (Subject/Year) → Subject/Year Selection → Quiz
```

### What Was Fixed:
- Removed the duplicate mode selection step
- Mode is now preselected when coming from Quiz Menu
- Streamlined navigation flow

---

## Test 2: Questions Displaying Fix

### Steps:
1. From the Exam Type page, select "JAMB"
2. Select "Subject-based practice"
3. Select "Mathematics" from the subject list
4. Click "Start Quiz"

### Expected Result:
✅ Questions should load and display
✅ You should see mathematics questions with options A, B, C, D
✅ Questions should have exam type (JAMB) and year information

### Check Browser Console:
- **Before migration:** You may see a warning about fallback query
- **After migration:** No warnings, questions load directly

### What Was Fixed:
- Added fallback query logic to load questions even without subject_id
- Database migration associates questions with Mathematics subject
- Questions now properly linked to subjects for optimal performance

---

## Test 3: Different Quiz Modes

### Test Practice Mode:
1. Navigate to `/quiz`
2. Select "Practice Mode"
3. Select JAMB → Subject → Mathematics
4. Start quiz
5. Answer a question
6. **Verify:** You get immediate feedback (correct/incorrect)
7. **Verify:** Explanation is shown
8. Click "Next" to proceed

### Test CBT Mode:
1. Navigate to `/quiz`
2. Select "CBT Quiz Exam"
3. Select WAEC → Subject → Mathematics
4. Start quiz
5. Answer questions
6. **Verify:** No immediate feedback
7. **Verify:** Timer is running (if configured)
8. Submit quiz
9. **Verify:** Results shown at the end

---

## Test 4: Year-Based Selection

### Steps:
1. Navigate to `/quiz`
2. Select any mode
3. Select JAMB
4. Select "Year-based practice"
5. Select a year (e.g., 2023)
6. Start quiz

### Expected Result:
✅ Questions from the selected year should load
✅ Questions from multiple subjects may appear (if available)

---

## Troubleshooting

### If Questions Don't Display:

1. **Check Database Migration:**
   ```sql
   SELECT COUNT(*) as total, 
          COUNT(subject_id) as with_subject 
   FROM questions;
   ```
   - Both counts should be equal (e.g., 215 total, 215 with_subject)

2. **Check Browser Console:**
   - Look for error messages
   - Check for fallback query warnings

3. **Verify Questions Exist:**
   ```sql
   SELECT COUNT(*) FROM questions WHERE is_active = true;
   ```
   - Should return > 0

4. **Check Subject Association:**
   ```sql
   SELECT s.name, COUNT(q.id) as question_count
   FROM subjects s
   LEFT JOIN questions q ON q.subject_id = s.id
   GROUP BY s.id, s.name
   ORDER BY question_count DESC;
   ```
   - Mathematics should have questions

### If Mode Selection Still Appears Twice:

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check that you're using the latest code
4. Verify `QuizModeSelector.tsx` has the `useNavigate` hook

---

## Success Criteria

✅ **Issue 1 Fixed:** Users select mode only once
✅ **Issue 2 Fixed:** Questions display in quiz interface
✅ **No Console Errors:** Browser console shows no errors
✅ **Smooth Navigation:** Flow is intuitive and streamlined
✅ **Questions Load:** Mathematics questions appear in quizzes

---

## Next Steps After Testing

1. **If Tests Pass:**
   - Deploy changes to production
   - Monitor for any issues
   - Consider adding more subjects and questions

2. **If Tests Fail:**
   - Check the troubleshooting section
   - Review browser console for errors
   - Verify database migration was applied
   - Contact support with error details

---

**Last Updated:** 2025-12-10
**Version:** 1.0

