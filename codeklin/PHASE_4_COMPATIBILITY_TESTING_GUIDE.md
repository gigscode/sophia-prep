# Phase 4 Compatibility Testing Guide

## 🎯 Purpose
Verify that questions imported through all admin dashboard methods work correctly in the new multi-subject quiz implementation.

---

## 📋 Test Scenarios

### Test 1: Copy-Paste Import → Multi-Subject Quiz

**Steps**:
1. Navigate to Admin Dashboard → Import Questions
2. Select format: "Simple Text"
3. Select import mode: "Paste Text"
4. Select Subject: "Biology"
5. Select Exam Type: "JAMB"
6. Paste sample question:
   ```
   Q: What is photosynthesis?
   A: Process of making food
   B: Process of respiration
   C: Process of digestion
   D: Process of excretion
   ANSWER: A
   EXPLANATION: Photosynthesis is the process by which plants make food using sunlight.
   ---
   ```
7. Click "Import Questions"
8. Verify success message

**Test Multi-Subject Quiz**:
9. Navigate to CBT Exam menu
10. Select "JAMB"
11. Select "Science" category
12. Start quiz
13. **Verify**: Biology questions appear with "Biology" subject badge
14. **Verify**: Subject badge is blue with rounded corners
15. **Verify**: Question displays correctly

**Expected Result**: ✅ Questions imported via copy-paste work in multi-subject quizzes with subject badges

---

### Test 2: CSV Import → Multi-Subject Quiz

**Steps**:
1. Navigate to Admin Dashboard → Import Questions
2. Select format: "CSV"
3. Select import mode: "Paste Text"
4. Paste CSV data:
   ```csv
   question_text,option_a,option_b,option_c,option_d,correct_answer,subject,exam_type,exam_year,explanation
   "What is Newton's First Law?","Law of Inertia","Law of Acceleration","Law of Action","Law of Gravity",A,physics,JAMB,2023,"Newton's First Law states that an object at rest stays at rest."
   "What is the atomic number of Carbon?","6","12","14","8",A,chemistry,JAMB,2023,"Carbon has 6 protons, so its atomic number is 6."
   ```
5. Click "Import Questions"
6. Verify success message

**Test Multi-Subject Quiz**:
7. Navigate to CBT Exam menu
8. Select "JAMB"
9. Select "Science" category
10. Start quiz
11. **Verify**: Physics questions show "Physics" badge
12. **Verify**: Chemistry questions show "Chemistry" badge
13. **Verify**: Questions are mixed (not all from one subject)

**Expected Result**: ✅ CSV imported questions work with correct subject badges

---

### Test 3: JSON Import (Array Format) → Multi-Subject Quiz

**Steps**:
1. Navigate to Admin Dashboard → Import Questions
2. Select format: "JSON"
3. Select import mode: "Paste Text"
4. Paste JSON data:
   ```json
   [
     {
       "question_text": "What is the capital of Nigeria?",
       "option_a": "Lagos",
       "option_b": "Abuja",
       "option_c": "Kano",
       "option_d": "Ibadan",
       "correct_answer": "B",
       "subject": "government",
       "exam_type": "JAMB",
       "exam_year": 2023,
       "explanation": "Abuja is the capital of Nigeria."
     },
     {
       "question_text": "Who wrote 'Things Fall Apart'?",
       "option_a": "Wole Soyinka",
       "option_b": "Chinua Achebe",
       "option_c": "Chimamanda Adichie",
       "option_d": "Ben Okri",
       "correct_answer": "B",
       "subject": "literature",
       "exam_type": "JAMB",
       "exam_year": 2023,
       "explanation": "Chinua Achebe wrote 'Things Fall Apart'."
     }
   ]
   ```
5. Click "Import Questions"
6. Verify success message

**Test Multi-Subject Quiz**:
7. Navigate to CBT Exam menu
8. Select "JAMB"
9. Select "Arts" category
10. Start quiz
11. **Verify**: Government questions show "Government" badge
12. **Verify**: Literature questions show "Literature" badge

**Expected Result**: ✅ JSON array format works with subject badges

---

### Test 4: JSON Import (Object Format) → Multi-Subject Quiz

**Steps**:
1. Navigate to Admin Dashboard → Import Questions
2. Select format: "JSON"
3. Select import mode: "Paste Text"
4. Paste JSON data:
   ```json
   {
     "economics": [
       {
         "question_text": "What is GDP?",
         "option_a": "Gross Domestic Product",
         "option_b": "General Development Plan",
         "option_c": "Global Distribution Point",
         "option_d": "Government Debt Payment",
         "correct_answer": "A",
         "exam_type": "JAMB",
         "exam_year": 2023,
         "explanation": "GDP stands for Gross Domestic Product."
       }
     ],
     "commerce": [
       {
         "question_text": "What is a bill of exchange?",
         "option_a": "A receipt",
         "option_b": "A negotiable instrument",
         "option_c": "A bank statement",
         "option_d": "A tax form",
         "correct_answer": "B",
         "exam_type": "JAMB",
         "exam_year": 2023,
         "explanation": "A bill of exchange is a negotiable instrument."
       }
     ]
   }
   ```
5. Click "Import Questions"
6. Verify success message

**Test Multi-Subject Quiz**:
7. Navigate to CBT Exam menu
8. Select "JAMB"
9. Select "Commercial" category
10. Start quiz
11. **Verify**: Economics questions show "Economics" badge
12. **Verify**: Commerce questions show "Commerce" badge

**Expected Result**: ✅ JSON object format works with subject badges

---

### Test 5: Subject Slug vs Name Resolution

**Purpose**: Verify that both subject names and slugs work in CSV/JSON imports

**Steps**:
1. Import questions using subject **name**: `"subject": "Mathematics"`
2. Import questions using subject **slug**: `"subject": "mathematics"`
3. Verify both imports succeed
4. Start multi-subject quiz
5. **Verify**: Both sets of questions appear with "Mathematics" badge

**Expected Result**: ✅ Both subject name and slug resolution work

---

### Test 6: Single-Subject Quiz (No Badge)

**Purpose**: Verify that single-subject quizzes don't show subject badges

**Steps**:
1. Navigate to Subjects page
2. Click "Practice" or "Quiz" on any subject (e.g., Mathematics)
3. Select year
4. Start quiz
5. **Verify**: NO subject badge appears on questions
6. **Verify**: Questions display normally

**Expected Result**: ✅ Single-subject quizzes don't show badges (correct behavior)

---

## ✅ Success Criteria

All tests pass if:
- ✅ Questions imported via all methods appear in multi-subject quizzes
- ✅ Subject badges display correctly with subject name
- ✅ Subject badges only appear in category-based quizzes
- ✅ Single-subject quizzes don't show badges
- ✅ Both subject names and slugs work in imports
- ✅ No errors in browser console
- ✅ Questions are properly shuffled and mixed

---

## 🐛 Troubleshooting

### Issue: Subject badge not showing
**Possible causes**:
- Question doesn't have `subject_id` in database
- Subject is inactive (`is_active = false`)
- Subject slug doesn't match ClassCategorySelector slugs

**Solution**:
- Check database: `SELECT * FROM questions WHERE id = '<question_id>'`
- Verify `subject_id` is not null
- Check subject: `SELECT * FROM subjects WHERE id = '<subject_id>'`
- Verify subject is active and has correct slug

### Issue: Wrong subject badge
**Possible causes**:
- Question has wrong `subject_id`
- Subject name/slug mismatch during import

**Solution**:
- Re-import question with correct subject
- Or update question in admin dashboard

### Issue: Questions not appearing in category quiz
**Possible causes**:
- Subject slug not in ClassCategorySelector combinations
- Questions are inactive
- No questions for that subject/exam type

**Solution**:
- Check ClassCategorySelector subject slug combinations
- Verify questions are active in database
- Import more questions for that subject

---

## 📊 Test Results Template

| Test | Status | Notes |
|------|--------|-------|
| Copy-Paste Import | ⬜ | |
| CSV Import | ⬜ | |
| JSON Array Import | ⬜ | |
| JSON Object Import | ⬜ | |
| Slug vs Name Resolution | ⬜ | |
| Single-Subject (No Badge) | ⬜ | |

**Overall Status**: ⬜ Pass / ⬜ Fail

**Tester**: _______________

**Date**: _______________

**Browser**: _______________

**Issues Found**: 
- 
- 
- 

---

## 🎉 Conclusion

If all tests pass, Phase 4 is fully compatible with all admin dashboard import methods! 🚀

