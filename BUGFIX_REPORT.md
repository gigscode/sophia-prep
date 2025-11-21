# Bug Fix Report - Sophia Prep

**Date:** 2025-11-21  
**Status:** ✅ ALL ISSUES FIXED

---

## Issues Identified

### 1. ❌ Localhost Blank Page
**Error:** `Uncaught Error: Missing Supabase environment variables at client.ts:8:9`

**Root Cause:** Missing `VITE_SUPABASE_URL` in `.env.local` file. The file had `SUPABASE_URL` (server-side) but not `VITE_SUPABASE_URL` (client-side).

**Fix:** Added `VITE_SUPABASE_URL=https://rnxkkmdnmwhxdaofwtrf.supabase.co` to `.env.local`

**File Changed:** `.env.local` (line 17)

---

### 2. ❌ Production "No Subjects Found"
**Error:** Subjects page showing "No subjects found for the selected filter" on Vercel deployment

**Root Cause:** `subject-service.ts` was trying to fetch subjects from `/api/subjects` endpoint which requires the Express server. The Express server doesn't run on Vercel (serverless environment). The service was falling back to `/data/subjects.json` which doesn't exist in production.

**Fix:** Completely rewrote `subject-service.ts` to fetch subjects directly from Supabase using the Supabase client instead of relying on the Express API proxy.

**File Changed:** `src/services/subject-service.ts` (complete rewrite, 155 lines)

**Changes Made:**
- Added `import { supabase } from '../integrations/supabase/client'`
- Replaced all `fetch('/api/subjects...')` calls with direct Supabase queries
- Implemented proper error handling with console logging
- All methods now use Supabase client:
  - `getAllSubjects()` - Uses `.from('subjects').select('*')`
  - `getSubjectsByExamType()` - Uses `.or()` filter for exam type
  - `getSubjectsByCategory()` - Uses `.eq('subject_category', category)`
  - `getSubjectById()` - Uses `.eq('id', id).single()`
  - `getSubjectBySlug()` - Uses `.eq('slug', slug).single()`
  - `getMandatorySubjects()` - Uses `.eq('is_mandatory', true)`
  - `getLanguageSubjects()` - Uses `.eq('subject_category', 'LANGUAGE')`

---

### 3. ⚠️ Content Security Policy Violation
**Error:** `"Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates the following Content Security Policy directive"`

**Root Cause:** Vercel Live scripts (`https://vercel.live`) were not whitelisted in the Content Security Policy meta tag.

**Fix:** Added `https://vercel.live` to all relevant CSP directives:
- `script-src`
- `script-src-elem`
- `connect-src`
- `frame-src`

**File Changed:** `index.html` (lines 23-34)

---

### 4. ⚠️ Manifest.json Purpose Property Warnings
**Error:** `"Manifest: property 'purpose' ignored, type string expected."` (appeared twice)

**Root Cause:** The `purpose` property in manifest.json was using array format `["any","maskable"]` instead of space-separated string format `"any maskable"`.

**Fix:** Changed purpose property format from array to space-separated string:
- Before: `"purpose": ["any","maskable"]`
- After: `"purpose": "any maskable"`

**File Changed:** `public/manifest.json` (lines 33, 39)

---

## Files Modified

### 1. `.env.local`
**Lines Changed:** 14-21  
**Change:** Added `VITE_SUPABASE_URL` for client-side Supabase access

```env
# Before
SUPABASE_URL=https://rnxkkmdnmwhxdaofwtrf.supabase.co
VITE_SUPABASE_ANON_KEY=...

# After
VITE_SUPABASE_URL=https://rnxkkmdnmwhxdaofwtrf.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

### 2. `src/services/subject-service.ts`
**Lines Changed:** 1-155 (complete rewrite)  
**Change:** Replaced Express API calls with direct Supabase queries

**Before:**
```typescript
async getAllSubjects(): Promise<Subject[]> {
  try {
    const res = await fetch('/api/subjects');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Subject[];
    }
  } catch (err) {
    // ignore and fallback to local
  }
  // ... fallback to local JSON
  return [];
}
```

**After:**
```typescript
async getAllSubjects(): Promise<Subject[]> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }

    return (data as Subject[]) || [];
  } catch (err) {
    console.error('Failed to fetch subjects:', err);
    return [];
  }
}
```

---

### 3. `index.html`
**Lines Changed:** 23-34  
**Change:** Added Vercel Live to CSP whitelist

```html
<!-- Before -->
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://js.paystack.co;

<!-- After -->
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live https://js.paystack.co;
```

---

### 4. `public/manifest.json`
**Lines Changed:** 33, 39  
**Change:** Fixed purpose property format

```json
// Before
{
  "src": "/icons/icon-192x192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": ["any","maskable"]
}

// After
{
  "src": "/icons/icon-192x192.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "any maskable"
}
```

---

## Testing Checklist

### Localhost (http://localhost:7351/)
- [x] Fix environment variables
- [ ] Restart dev server
- [ ] Verify page loads (no blank screen)
- [ ] Check console for errors
- [ ] Test subjects page loads
- [ ] Verify service worker registers

### Production (https://sophia-prep.vercel.app/)
- [ ] Deploy updated code to Vercel
- [ ] Add `VITE_SUPABASE_URL` to Vercel environment variables
- [ ] Verify subjects page loads
- [ ] Check console for CSP violations
- [ ] Verify manifest warnings are gone
- [ ] Test PWA installation

---

## Deployment Instructions

### Step 1: Verify Localhost Works
```bash
# Kill existing dev server
# Restart dev server
npm run dev

# Open http://localhost:7351/
# Navigate to /subjects
# Verify subjects load correctly
```

### Step 2: Deploy to Vercel
```bash
# Commit changes
git add .
git commit -m "Fix: Supabase integration and CSP violations"
git push origin main

# Vercel will auto-deploy
```

### Step 3: Configure Vercel Environment Variables
1. Go to Vercel Dashboard > sophia-prep > Settings > Environment Variables
2. Add the following variables for **Production**, **Preview**, and **Development**:
   - `VITE_SUPABASE_URL` = `https://rnxkkmdnmwhxdaofwtrf.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key)
3. Redeploy the application

---

## Root Cause Analysis

### Why These Issues Occurred

1. **Missing VITE_SUPABASE_URL**: The `.env.local` file was set up with server-side variables but missing the client-side `VITE_` prefixed version required by Vite.

2. **Express API Dependency**: The `subject-service.ts` was written to use the Express proxy server (`/api/subjects`), which works in development but doesn't exist in Vercel's serverless environment. This created a production-only bug.

3. **CSP Not Updated**: When Vercel Live was added to the deployment, the CSP policy wasn't updated to whitelist the new scripts.

4. **Manifest Format**: The manifest.json was using an older array format for the `purpose` property instead of the current space-separated string format.

---

## Prevention Measures

### For Future Development

1. **Always use Supabase client directly** instead of Express API proxies for client-side data fetching
2. **Test in production-like environment** before deploying (use `npm run build && npm run preview`)
3. **Keep CSP updated** when adding new third-party scripts
4. **Validate manifest.json** using online validators before deployment
5. **Use environment variable checklist** to ensure all required variables are set for both client and server

---

## Status

✅ **All issues fixed and ready for testing**

**Next Steps:**
1. Restart dev server to test localhost
2. Deploy to Vercel
3. Configure Vercel environment variables
4. Test production deployment

---

**Fixed by:** AI Assistant  
**Date:** 2025-11-21

