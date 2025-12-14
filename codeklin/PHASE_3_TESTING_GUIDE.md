# Phase 3 Testing Guide
## Proportional Timing Implementation

**Date:** 2025-12-10

---

## 🧪 Pre-Testing Setup

### Step 1: Run Database Migration

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `PHASE_3_TIMER_CONFIGURATIONS.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify success message appears

**Expected Output:**
```
✅ Timer configurations added successfully!

Summary:
- JAMB Full Exam: 2.5 hours (9000s)
- WAEC Full Exam: 3 hours (10800s)
- JAMB per subject: ~37.5 min (2250s)
- WAEC per subject: ~20 min (1200s)
```

### Step 2: Verify Database Configurations

Run this query in Supabase SQL Editor:
```sql
SELECT 
  exam_type,
  COALESCE(subject_slug, 'ALL SUBJECTS') as subject,
  duration_seconds,
  CONCAT(FLOOR(duration_seconds / 60), ' min') as duration
FROM timer_configurations
ORDER BY exam_type, subject_slug NULLS FIRST;
```

**Expected Results:**
- JAMB ALL SUBJECTS: 9000s (150 min)
- JAMB mathematics: 2250s (37 min)
- JAMB english: 2250s (37 min)
- WAEC ALL SUBJECTS: 10800s (180 min)
- WAEC mathematics: 1200s (20 min)
- WAEC english: 1200s (20 min)

---

## 🧪 Test Cases

### Test 1: JAMB Quiz with Standard Question Count (40 questions)

**Steps:**
1. Navigate to `/subjects`
2. Find a JAMB subject (e.g., Mathematics)
3. Click green "Quiz" button
4. Select any year or "All Years"
5. Wait for quiz to load

**Expected Results:**
- ✅ Timer info banner appears at top
- ✅ Shows: "Total Time: 37:30 (40 questions) • ~1 min per question"
- ✅ Timer starts counting down from ~37:30
- ✅ Timer displays in header (top right)

---

### Test 2: JAMB Quiz with Fewer Questions (10-20 questions)

**Steps:**
1. Navigate to `/subjects`
2. Find a JAMB subject with limited questions
3. Click green "Quiz" button
4. Select a specific year with fewer questions
5. Wait for quiz to load

**Expected Results:**
- ✅ Timer duration is proportional to question count
- ✅ Example: 10 questions → ~10 min timer
- ✅ Example: 20 questions → ~20 min timer
- ✅ Timer info banner shows correct calculation
- ✅ Time per question is ~1 min

**Calculation Check:**
```
JAMB: 56.25 seconds per question
10 questions = 562.5s → rounds to 600s (10 min)
20 questions = 1125s → rounds to 1200s (20 min)
```

---

### Test 3: WAEC Quiz with Standard Question Count (40 questions)

**Steps:**
1. Navigate to `/subjects`
2. Find a WAEC subject
3. Click green "Quiz" button
4. Select any year or "All Years"
5. Wait for quiz to load

**Expected Results:**
- ✅ Timer shows ~20 min (1200s)
- ✅ Timer info banner shows: "Total Time: 20:00 (40 questions) • ~0 min per question"
- ✅ Time per question is ~30 seconds

---

### Test 4: WAEC Quiz with Fewer Questions (20 questions)

**Steps:**
1. Navigate to `/subjects`
2. Find a WAEC subject
3. Click green "Quiz" button
4. Select a year with ~20 questions
5. Wait for quiz to load

**Expected Results:**
- ✅ Timer shows ~10 min (600s)
- ✅ Proportional to question count
- ✅ Time per question is ~30 seconds

**Calculation Check:**
```
WAEC: 30 seconds per question
20 questions = 600s (10 min)
```

---

### Test 5: Timer Info Banner Behavior

**Steps:**
1. Start any quiz in exam mode
2. Observe timer info banner on first question
3. Click "Next" to go to question 2
4. Observe timer info banner

**Expected Results:**
- ✅ Banner shows on question 1 (`currentIndex === 0`)
- ✅ Banner disappears on question 2 and beyond
- ✅ Banner has blue background (info styling)
- ✅ Banner shows info icon (ℹ️)

---

### Test 6: Practice Mode (No Timer)

**Steps:**
1. Navigate to `/subjects`
2. Click blue "Practice" button on any subject
3. Select year
4. Wait for quiz to load

**Expected Results:**
- ✅ No timer displayed
- ✅ No timer info banner
- ✅ Score displayed instead of timer
- ✅ Immediate feedback after answering

---

### Test 7: Subject Without Database Config

**Steps:**
1. Find a subject that's NOT in the database config (not Math/English/Physics/Chemistry/Biology)
2. Click green "Quiz" button
3. Select year
4. Wait for quiz to load
5. Open browser console (F12)

**Expected Results:**
- ✅ Console shows: "No timer config found, calculating proportional duration for X questions"
- ✅ Timer duration is calculated using `calculateProportionalDuration()`
- ✅ Timer works correctly
- ✅ No errors in console

---

### Test 8: Timer Countdown Accuracy

**Steps:**
1. Start any quiz in exam mode
2. Note the starting time
3. Wait 1 minute
4. Check timer

**Expected Results:**
- ✅ Timer decreases by 60 seconds after 1 minute
- ✅ Timer format is MM:SS
- ✅ Timer updates every second
- ✅ No jumps or skips in countdown

---

### Test 9: Timer Warning (< 5 minutes)

**Steps:**
1. Start a quiz with short duration (e.g., 10 questions)
2. Wait until timer reaches < 5 minutes
3. Observe timer display

**Expected Results:**
- ✅ Timer text turns red when < 5 minutes
- ✅ Screen reader announcement: "Warning: Less than 5 minutes remaining"
- ✅ Timer continues counting down normally

---

### Test 10: Timer Expiration

**Steps:**
1. Start a quiz with very short duration (e.g., 5 questions)
2. Wait for timer to reach 00:00
3. Observe behavior

**Expected Results:**
- ✅ Quiz auto-submits when timer reaches 00:00
- ✅ Results page displays
- ✅ No errors in console
- ✅ Timer is cleared from localStorage

---

### Test 11: Mobile Responsiveness

**Steps:**
1. Open DevTools (F12)
2. Switch to mobile view (iPhone/Android)
3. Start a quiz in exam mode
4. Check timer info banner and timer display

**Expected Results:**
- ✅ Timer info banner is responsive
- ✅ Text wraps appropriately on small screens
- ✅ Timer displays correctly in header
- ✅ All elements are readable

---

### Test 12: Browser Console Check

**Steps:**
1. Open browser console (F12)
2. Start any quiz in exam mode
3. Monitor console for messages

**Expected Results:**
- ✅ No errors in console
- ✅ May see info message about proportional calculation
- ✅ No warnings about timer initialization
- ✅ Clean console output

---

## 🐛 Common Issues & Solutions

### Issue 1: Timer Shows Wrong Duration

**Symptoms:** Timer shows unexpected duration (e.g., 35 min instead of 37.5 min)

**Possible Causes:**
- Database migration not run
- Falling back to hardcoded defaults

**Solution:**
1. Check browser console for messages
2. Verify database migration was run
3. Check `timer_configurations` table in Supabase

---

### Issue 2: Timer Info Banner Not Showing

**Symptoms:** No blue info banner at quiz start

**Possible Causes:**
- Not in exam mode (practice mode doesn't show timer)
- Already navigated past first question

**Solution:**
1. Verify you're in exam mode (green "Quiz" button)
2. Check you're on first question (`currentIndex === 0`)
3. Refresh page to restart quiz

---

### Issue 3: Proportional Calculation Not Working

**Symptoms:** All quizzes show same duration regardless of question count

**Possible Causes:**
- Database config overriding calculation
- Question count not being passed

**Solution:**
1. Check browser console for calculation message
2. Verify `questionCount` is being passed in `UnifiedQuiz.tsx`
3. Check `timer-service.ts` logic

---

## ✅ Success Criteria

### Phase 3 is successful if:
- [ ] Database migration runs without errors
- [ ] Timer configurations are inserted correctly
- [ ] JAMB quizzes show proportional timing (~1 min per question)
- [ ] WAEC quizzes show proportional timing (~30 sec per question)
- [ ] Timer info banner displays on first question
- [ ] Timer countdown works accurately
- [ ] Timer turns red at < 5 minutes
- [ ] Quiz auto-submits when timer expires
- [ ] Practice mode doesn't show timer
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fallback calculation works for subjects without config

---

## 📊 Test Results Template

Use this template to record your test results:

```
Test 1: JAMB 40 questions
- Timer duration: _____ (Expected: ~37:30)
- Info banner: ✅ / ❌
- Time per question: _____ (Expected: ~1 min)

Test 2: JAMB 10 questions
- Timer duration: _____ (Expected: ~10:00)
- Info banner: ✅ / ❌
- Time per question: _____ (Expected: ~1 min)

Test 3: WAEC 40 questions
- Timer duration: _____ (Expected: ~20:00)
- Info banner: ✅ / ❌
- Time per question: _____ (Expected: ~30 sec)

Test 4: WAEC 20 questions
- Timer duration: _____ (Expected: ~10:00)
- Info banner: ✅ / ❌
- Time per question: _____ (Expected: ~30 sec)

Overall: ✅ PASS / ❌ FAIL
```

---

**Happy Testing! 🎉**

