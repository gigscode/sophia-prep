# Codeklin - Archived Unused Files

This folder contains files that were removed from the active Sophia Prep application but preserved for reference.

## Date Archived
December 14, 2025

## Reason for Archival
These files were identified as unused in the current application flow and removed to simplify the codebase.

## Files Archived

### Pages (codeklin/pages/)
1. **SubjectsPage.tsx** - Browse subjects page
   - Reason: Not used in current navigation flow
   - Replaced by: Direct navigation to `/practice` for practice questions

2. **SubjectDetailPage.tsx** - Individual subject detail page
   - Reason: Not used in current navigation flow
   - Replaced by: Practice mode with subject selection

### Deprecated Quiz Pages (codeklin/deprecated/)
1. **CBTQuiz.tsx** - Old CBT quiz implementation
   - Reason: Deprecated in favor of UnifiedQuiz
   - Marked as deprecated in code comments

2. **PracticeModeQuiz.tsx** - Old practice mode implementation
   - Reason: Deprecated in favor of UnifiedQuiz
   - Marked as deprecated in code comments

3. **UniversalQuizConfigDemo.tsx** - Demo/test component
   - Reason: Test/demo component not needed in production

### Test Components (codeklin/components/)
1. **NavigationTest.tsx** - Navigation testing component
   - Reason: Development/testing component

2. **TestNewSchema.tsx** - Schema testing component
   - Reason: Development/testing component
   - Was accessible via `/test-schema` route (now removed)

## Active Application Routes

The following routes are actively used in the application:

### Main Navigation (Bottom Nav)
- `/` - Home
- `/practice` - Practice Mode
- `/jamb-exam` - CBT Exam
- `/study` - Study Hub
- `/more` - More Page

### Study Resources (from Study Hub)
- `/syllabus` - JAMB Syllabi
- `/summaries` - Topic Summaries
- `/novels` - Prescribed Novels
- `/videos` - Video Lessons

### Quiz Flow
- `/quiz` - Quiz Mode Selector
- `/quiz/mode-selection` - Mode Selection
- `/quiz/class-category` - Class Category Selection
- `/quiz/unified` - Unified Quiz Page
- `/quiz/results` - Quiz Results
- `/quiz/optimized` - Optimized Quiz Page

### User & Auth
- `/profile` - User Profile
- `/login` - Login
- `/signup` - Sign Up
- `/forgot-password` - Forgot Password
- `/reset-password` - Reset Password

### Info Pages
- `/help` - Help Center
- `/about` - About Page
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/contact` - Contact Page

### Admin (Protected)
- `/7351/admin` - Admin Dashboard
- `/admin/import-questions` - Import Questions

## Changes Made to Active Code

### Files Modified
1. **src/config/routes.ts**
   - Removed SubjectsPage and SubjectDetailPage imports
   - Removed `/subjects` and `/subjects/:slug` route configurations

2. **src/App.tsx**
   - Updated critical routes preload list
   - Removed TestNewSchema import and route

3. **src/components/layout/BottomNav.tsx**
   - Changed "Subjects" to "CBT Exam" in navigation

4. **src/components/home/QuickLinksSection.tsx**
   - Changed "Study Past Questions" route from `/subjects` to `/practice`

5. **src/pages/HomePage.tsx**
   - Updated hero banner action to navigate to `/practice` instead of `/subjects`

6. **src/components/layout/Footer.tsx**
   - Changed "Subjects" link to "Practice"

7. **src/pages/NotFoundPage.tsx**
   - Updated suggestions to use `/practice` instead of `/subjects`

8. **src/utils/route-preloading.ts**
   - Updated route preloading logic to use `/practice` instead of `/subjects`

9. **src/services/navigation-error-service.ts**
   - Updated feature detection to use "Practice Navigation"

10. **src/components/routing/RouteParamValidator.tsx**
    - Updated important routes list

### Test Files Modified
1. **src/tests/NavigationRoutes.test.tsx**
   - Updated test expectations for new routes

2. **src/config/routes.test.ts**
   - Updated route configuration tests

## Restoration Instructions

If you need to restore any of these files:

1. Copy the file from `codeklin/` back to its original location
2. Re-add the route configuration in `src/config/routes.ts`
3. Re-add any necessary imports in `src/App.tsx`
4. Update navigation components to include the restored routes
5. Run `npm run build` to verify everything works

## Notes

- All files in this folder are preserved exactly as they were when archived
- The application builds and runs successfully without these files
- No breaking changes were introduced by removing these files

