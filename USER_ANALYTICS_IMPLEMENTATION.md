# User Analytics Implementation - Complete Guide

## 📊 Overview

A comprehensive user analytics system has been implemented to track quiz performance, attempts, and provide detailed insights on the user's profile page.

---

## 🎯 Features Implemented

### 1. **Analytics Tracking**
- ✅ Quiz attempts (total count, by subject, by quiz mode)
- ✅ Questions answered (correct/incorrect)
- ✅ Pass rate percentage (quizzes with score ≥ 50%)
- ✅ Time spent on quizzes
- ✅ Subject-wise performance
- ✅ Quiz mode statistics (Practice vs CBT)

### 2. **Profile Page Analytics Dashboard**
- ✅ Overview statistics cards
- ✅ Subject performance breakdown
- ✅ Quiz mode statistics
- ✅ Visual progress indicators
- ✅ Color-coded performance metrics

---

## 📁 Files Created/Modified

### **New Files:**

1. **`src/services/analytics-service.ts`**
   - Core analytics service with methods to save and retrieve quiz data
   - Methods:
     - `saveQuizAttempt()` - Save quiz completion data
     - `getUserAnalytics()` - Get overall user statistics
     - `getSubjectPerformance()` - Get subject-wise breakdown
     - `getQuizModeStats()` - Get statistics by quiz mode
     - `getPerformanceTrend()` - Get performance over time
     - `getRecentAttempts()` - Get recent quiz attempts

2. **`src/components/analytics/AnalyticsDashboard.tsx`**
   - React component displaying comprehensive analytics
   - Features:
     - Overview cards (Total Attempts, Average Score, Best Score, Pass Rate)
     - Additional stats (Questions Attempted, Correct Answers, Avg Time)
     - Subject performance with progress bars
     - Quiz mode statistics with color-coded cards

### **Modified Files:**

1. **`src/pages/PracticeModeQuiz.tsx`**
   - Added analytics tracking on quiz completion
   - Saves attempt data before navigating to results

2. **`src/pages/CBTQuiz.tsx`**
   - Added analytics tracking on quiz completion
   - Saves attempt data with time tracking

3. **`src/pages/ProfilePage.tsx`**
   - Complete redesign with tabbed interface
   - Added "Analytics" tab with full dashboard
   - Improved profile information display

---

## 🗄️ Database Structure

The system uses the existing `quiz_attempts` table:

```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID,
  topic_id UUID,
  quiz_mode TEXT, -- 'PRACTICE', 'MOCK_EXAM', 'READER', 'PAST_QUESTIONS'
  total_questions INTEGER,
  correct_answers INTEGER,
  incorrect_answers INTEGER,
  score_percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  exam_year INTEGER,
  questions_data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

---

## 📈 Analytics Metrics

### **Overall Statistics:**
- **Total Attempts**: Count of all quiz attempts
- **Average Score**: Mean score across all attempts
- **Best Score**: Highest score achieved
- **Worst Score**: Lowest score achieved
- **Pass Rate**: Percentage of quizzes with score ≥ 50%
- **Total Questions**: Sum of all questions attempted
- **Correct Answers**: Sum of all correct answers
- **Average Time**: Mean time spent per quiz

### **Subject Performance:**
For each subject:
- Number of attempts
- Average score
- Best score
- Total questions attempted
- Correct answers
- Pass rate
- Accuracy percentage

### **Quiz Mode Statistics:**
For each mode (Practice, CBT):
- Number of attempts
- Average score
- Total questions
- Correct answers

---

## 🎨 UI/UX Features

### **Color Coding:**
- 🟢 **Green** (≥75%): Excellent performance
- 🟡 **Yellow** (50-74%): Good performance
- 🔴 **Red** (<50%): Needs improvement

### **Visual Elements:**
- Icon-based stat cards
- Progress bars for subject performance
- Color-coded performance indicators
- Responsive grid layouts
- Loading states
- Empty states with helpful messages

---

## 🔧 How It Works

### **1. Quiz Completion Flow:**

```typescript
// When user completes a quiz:
1. Calculate score and time taken
2. Get subject_id from subject slug
3. Call analyticsService.saveQuizAttempt()
4. Navigate to results page
```

### **2. Analytics Display Flow:**

```typescript
// When user visits profile page:
1. Load user analytics (overall stats)
2. Load subject performance data
3. Load quiz mode statistics
4. Display in organized dashboard
```

### **3. Data Retrieval:**

```typescript
// Analytics service automatically:
- Filters by current user
- Calculates aggregated statistics
- Groups data by subject/mode
- Sorts by relevance
```

---

## 📱 Profile Page Structure

```
Profile Page
├── Profile Header (Avatar, Name, Email)
├── Tabs
│   ├── Profile Tab
│   │   └── Account Information
│   └── Analytics Tab
│       ├── Overview Stats (4 cards)
│       ├── Additional Stats (3 cards)
│       ├── Subject Performance (expandable list)
│       └── Quiz Mode Statistics (grid)
```

---

## 🚀 Usage Examples

### **Saving a Quiz Attempt:**

```typescript
import { analyticsService } from '../services/analytics-service';

await analyticsService.saveQuizAttempt({
  subject_id: 'uuid-here',
  quiz_mode: 'practice', // or 'cbt'
  total_questions: 20,
  correct_answers: 15,
  time_taken_seconds: 600,
  exam_year: 2024,
  questions_data: [...]
});
```

### **Getting User Analytics:**

```typescript
const analytics = await analyticsService.getUserAnalytics();
// Returns: { total_attempts, average_score, best_score, pass_rate, ... }
```

### **Getting Subject Performance:**

```typescript
const performance = await analyticsService.getSubjectPerformance();
// Returns array of subject stats
```

---

## ✅ Testing Checklist

- [x] Quiz attempts are saved to database
- [x] Analytics display correctly on profile page
- [x] Subject performance shows accurate data
- [x] Quiz mode statistics are calculated correctly
- [x] Pass rate is calculated properly (≥50%)
- [x] Color coding works for different score ranges
- [x] Empty states display when no data exists
- [x] Loading states show during data fetch
- [x] Responsive design works on mobile
- [x] Tab switching works smoothly

---

## 🎯 Key Benefits

1. **User Insights**: Students can track their progress and identify weak areas
2. **Motivation**: Visual progress indicators encourage continued learning
3. **Data-Driven**: Performance metrics help users focus study efforts
4. **Comprehensive**: Covers all aspects of quiz performance
5. **User-Friendly**: Clean, intuitive interface with color coding
6. **Scalable**: Built on robust database structure

---

## 🔮 Future Enhancements (Optional)

- Performance trends over time (line charts)
- Comparison with other users (leaderboard)
- Study recommendations based on weak subjects
- Achievement badges and milestones
- Export analytics as PDF
- Weekly/monthly performance reports
- Topic-level analytics (not just subject-level)

---

## 📝 Notes

- All analytics are user-specific (filtered by auth.uid())
- Data is automatically saved after each quiz completion
- No manual intervention required from users
- Analytics update in real-time
- Pass rate threshold is set at 50% (configurable)
- Time tracking is in seconds (converted to minutes for display)

---

## 🎉 Implementation Complete!

The user analytics system is now fully functional and integrated into the application. Users can view their comprehensive performance data on the Profile page under the Analytics tab.
