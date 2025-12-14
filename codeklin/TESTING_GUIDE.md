# Testing Guide - Sophia Prep Fixes

## Quick Testing Checklist

### ✅ Issue 1: Import Questions Feature

#### Test 1: Access Import Dialog
1. Navigate to `http://localhost:7351/admin`
2. Login with admin credentials
3. Click on "Questions" tab
4. Click "Import Questions" button
5. **Expected:** Import dialog should open

#### Test 2: Download Templates
1. In the import dialog, ensure "JSON" format is selected
2. Click "Download JSON Template"
3. **Expected:** A `questions_template.json` file should download
4. Switch to "CSV" format
5. Click "Download CSV Template"
6. **Expected:** A `questions_template.csv` file should download

#### Test 3: Import JSON Questions
1. Open the downloaded `questions_template.json`
2. Modify or add more questions following the same format
3. In the import dialog:
   - Select "JSON" format
   - (Optional) Select a subject from dropdown
   - (Optional) Select a topic from dropdown
   - Click the upload area or drag and drop your JSON file
4. Click "Import Questions"
5. **Expected:** 
   - Progress indicator should show
   - Success message with count of imported questions
   - Questions should appear in the questions list

#### Test 4: Import CSV Questions
1. Open the downloaded `questions_template.csv` in Excel or text editor
2. Add more questions following the CSV format
3. In the import dialog:
   - Select "CSV" format
   - Upload your CSV file
4. Click "Import Questions"
5. **Expected:** Questions imported successfully

#### Test 5: Error Handling
1. Create a JSON file with missing required fields (e.g., no `correct_answer`)
2. Try to import
3. **Expected:** 
   - Error message showing which questions failed
   - Detailed error list
   - Successful questions still imported

---

### ✅ Issue 2: PWA Installation

#### Test 1: PWA Install Prompt (Desktop Chrome/Edge)
1. Open `http://localhost:7351/` in Chrome or Edge
2. Wait a few seconds
3. **Expected:** 
   - Install prompt should appear at bottom-right (desktop) or bottom (mobile)
   - Prompt should have gold (#B78628) accent color
   - "Install" and "Not Now" buttons visible

#### Test 2: Install PWA on Desktop
1. Click "Install" button in the prompt
2. **Expected:**
   - Browser's native install dialog appears
   - App installs and opens in standalone window
   - App icon appears in taskbar/dock

#### Test 3: PWA Manifest and Theme Color
1. Open browser DevTools (F12)
2. Go to "Application" tab
3. Click "Manifest" in left sidebar
4. **Expected:**
   - Name: "Sophia Prep - JAMB/WAEC Exam Preparation"
   - Theme color: #B78628 (gold)
   - Background color: #FFFFFF (white)
   - All icons listed with correct sizes

#### Test 4: Service Worker
1. In DevTools → Application → Service Workers
2. **Expected:**
   - Service worker registered and activated
   - Version: sophia-prep-v2
   - Status: "activated and is running"

#### Test 5: iOS Testing (If you have an iPhone/iPad)
1. Open Safari on iOS device
2. Navigate to your deployed app URL
3. Wait for iOS instructions prompt to appear
4. **Expected:**
   - Prompt with 3-step installation guide
   - Gold accent color
   - Clear instructions for Safari share button

#### Test 6: Dismiss and Reset
1. Click "Not Now" or "X" to dismiss the install prompt
2. Reload the page
3. **Expected:** Prompt should NOT appear (dismissed state saved)
4. Open browser console and run:
   ```javascript
   localStorage.removeItem('pwa-install-dismissed');
   ```
5. Reload the page
6. **Expected:** Prompt appears again

#### Test 7: Offline Functionality
1. Install the PWA
2. Open DevTools → Network tab
3. Check "Offline" checkbox
4. Navigate through the app
5. **Expected:**
   - Cached pages load successfully
   - Service worker serves cached assets

---

## Visual Verification

### Brand Color Consistency
Check that these elements use gold (#B78628):
- ✅ Import dialog "Import Questions" button
- ✅ PWA install prompt background/accent
- ✅ Theme color in browser address bar (mobile)
- ✅ App theme color in manifest

### Responsive Design
Test on different screen sizes:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

---

## Common Issues and Solutions

### Import Dialog Not Opening
- **Solution:** Check browser console for errors
- Verify admin authentication
- Refresh the page

### PWA Prompt Not Appearing
- **Solution:** 
  - Clear localStorage: `localStorage.removeItem('pwa-install-dismissed')`
  - Clear browser cache
  - Ensure HTTPS (or localhost)
  - Check if already installed

### Service Worker Not Registering
- **Solution:**
  - Check browser console for errors
  - Verify `/sw.js` and `/register-sw.js` are accessible
  - Clear browser cache and hard reload (Ctrl+Shift+R)

### Import Fails with Validation Errors
- **Solution:**
  - Download and use the provided templates
  - Ensure all required fields are present
  - Check correct_answer is A, B, C, or D
  - Verify difficulty_level is EASY, MEDIUM, or HARD

---

## Browser Compatibility

### Tested and Working:
- ✅ Chrome 90+ (Desktop & Mobile)
- ✅ Edge 90+ (Desktop & Mobile)
- ✅ Safari 14+ (Desktop & iOS)
- ✅ Firefox 88+ (Desktop)

### PWA Install Support:
- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS - manual via Share button)
- ⚠️ Firefox (Limited PWA support)

---

## Performance Checks

1. **Import Speed:**
   - 10 questions: < 2 seconds
   - 100 questions: < 10 seconds
   - 1000 questions: < 60 seconds

2. **PWA Load Time:**
   - First load: < 3 seconds
   - Cached load: < 1 second
   - Offline load: < 500ms

---

## Deployment Notes

Before deploying to production:

1. ✅ Test import with real question data
2. ✅ Verify PWA works on HTTPS domain
3. ✅ Test on actual mobile devices (Android & iOS)
4. ✅ Check service worker caching strategy
5. ✅ Verify all icons are properly sized and optimized
6. ✅ Test offline functionality thoroughly

---

**Happy Testing! 🎉**

If you find any issues, check the browser console for error messages and refer to the FIXES_SUMMARY.md for implementation details.

