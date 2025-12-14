# PWA Testing Guide - Sophia Prep

**Date:** 2025-11-21  
**Phase:** 5 - PWA Functionality Testing

---

## Overview

This guide provides comprehensive instructions for testing the Progressive Web App (PWA) functionality of Sophia Prep across different platforms and browsers.

---

## PWA Configuration Summary

### ✅ Manifest Configuration
- **File:** `public/manifest.json`
- **Name:** Sophia Prep - JAMB/WAEC Exam Preparation
- **Short Name:** Sophia Prep
- **Display Mode:** Standalone
- **Theme Color:** #1E40AF (Blue)
- **Background Color:** #1E40AF
- **Orientation:** Portrait Primary
- **Icons:** 6 sizes (48x48 to 512x512)
- **Shortcuts:** 3 (Quick Practice, Mock Exam, Subjects)

### ✅ Service Worker
- **File:** `public/sw.js`
- **Cache Name:** sophia-prep-v1
- **Runtime Cache:** sophia-prep-runtime-v1
- **Strategy:** Cache First with Network Fallback
- **Precached Assets:** 8 essential files

### ✅ Registration
- **File:** `public/register-sw.js`
- **Auto-registration:** On page load
- **Update Check:** Every 60 seconds
- **Auto-reload:** On service worker update

---

## Testing Checklist

### 1. Desktop Testing (Chrome/Edge)

#### Installation Test
- [ ] Open http://localhost:7351/ in Chrome/Edge
- [ ] Look for install icon in address bar (⊕ or computer icon)
- [ ] Click install button
- [ ] Verify app opens in standalone window
- [ ] Check app icon appears in taskbar/dock
- [ ] Verify app appears in Start Menu/Applications

#### Functionality Test
- [ ] Navigate through all pages
- [ ] Test quiz modes (Practice, Mock Exam, Reader, Past Questions)
- [ ] Verify all images load correctly
- [ ] Check that navigation works smoothly
- [ ] Test subject selection and filtering

#### Offline Test
- [ ] Open DevTools (F12)
- [ ] Go to Application tab > Service Workers
- [ ] Check "Offline" checkbox
- [ ] Refresh the page
- [ ] Verify app still loads
- [ ] Test navigation between cached pages
- [ ] Verify cached images display
- [ ] Uncheck "Offline" to restore connection

#### Service Worker Test
- [ ] Open DevTools > Application > Service Workers
- [ ] Verify service worker is "activated and running"
- [ ] Check Cache Storage shows "sophia-prep-v1"
- [ ] Verify precached assets are listed
- [ ] Test "Update on reload" option
- [ ] Click "Unregister" and reload to re-register

---

### 2. iOS Testing (Safari)

#### Installation Test
- [ ] Open https://your-deployed-url.com in Safari
- [ ] Tap Share button (square with arrow)
- [ ] Scroll down and tap "Add to Home Screen"
- [ ] Verify app name shows as "Sophia Prep"
- [ ] Verify app icon displays correctly
- [ ] Tap "Add" to install
- [ ] Check app icon appears on home screen

#### Functionality Test
- [ ] Tap app icon to launch
- [ ] Verify app opens in fullscreen (no Safari UI)
- [ ] Check splash screen displays correctly
- [ ] Test all quiz modes
- [ ] Verify touch interactions work smoothly
- [ ] Test subject selection dropdowns
- [ ] Check that back button works correctly

#### Offline Test
- [ ] Enable Airplane Mode
- [ ] Launch app from home screen
- [ ] Verify app loads
- [ ] Test navigation between pages
- [ ] Check cached content displays
- [ ] Disable Airplane Mode

#### iOS-Specific Checks
- [ ] Verify status bar color matches theme (#1E40AF)
- [ ] Check app doesn't show Safari address bar
- [ ] Test orientation lock (portrait only)
- [ ] Verify app stays in memory when switching apps
- [ ] Test pull-to-refresh behavior

---

### 3. Android Testing (Chrome)

#### Installation Test
- [ ] Open https://your-deployed-url.com in Chrome
- [ ] Look for "Add to Home screen" banner at bottom
- [ ] Tap "Add" or tap menu > "Install app"
- [ ] Verify app name shows as "Sophia Prep"
- [ ] Verify app icon displays correctly
- [ ] Tap "Install" to confirm
- [ ] Check app icon appears on home screen

#### Functionality Test
- [ ] Tap app icon to launch
- [ ] Verify app opens in standalone mode
- [ ] Check splash screen displays correctly
- [ ] Test all quiz modes
- [ ] Verify touch interactions work smoothly
- [ ] Test subject selection dropdowns
- [ ] Check that back button works correctly

#### Offline Test
- [ ] Enable Airplane Mode
- [ ] Launch app from home screen
- [ ] Verify app loads
- [ ] Test navigation between pages
- [ ] Check cached content displays
- [ ] Disable Airplane Mode

#### Android-Specific Checks
- [ ] Verify app appears in app drawer
- [ ] Check app info shows correct name and icon
- [ ] Test Android back button navigation
- [ ] Verify app stays in recent apps list
- [ ] Test notification permissions (if applicable)

---

## Advanced Testing

### Performance Testing
- [ ] Open DevTools > Lighthouse
- [ ] Run PWA audit
- [ ] Verify PWA score is 90+
- [ ] Check Performance score
- [ ] Review Accessibility score
- [ ] Check Best Practices score
- [ ] Review SEO score

### Cache Testing
- [ ] Open DevTools > Application > Cache Storage
- [ ] Verify "sophia-prep-v1" cache exists
- [ ] Check precached assets are present:
  - [ ] / (root)
  - [ ] /index.html
  - [ ] /favicon.png
  - [ ] /apple-touch-icon.png
  - [ ] /manifest.json
  - [ ] /icons/icon-192x192.png
  - [ ] /icons/icon-512x512.png
  - [ ] /sophiahero2.png

### Network Testing
- [ ] Open DevTools > Network tab
- [ ] Filter by "Service Worker"
- [ ] Reload page
- [ ] Verify assets served from service worker
- [ ] Check "(from ServiceWorker)" label on cached resources

### Update Testing
- [ ] Make a change to service worker version
- [ ] Deploy updated version
- [ ] Open app
- [ ] Verify update notification appears
- [ ] Confirm app reloads with new version
- [ ] Check old cache is deleted

---

## Common Issues and Solutions

### Issue: Install button doesn't appear
**Solution:**
- Ensure HTTPS is enabled (or localhost for testing)
- Check manifest.json is valid
- Verify service worker is registered
- Check browser console for errors

### Issue: App doesn't work offline
**Solution:**
- Verify service worker is activated
- Check cache storage contains assets
- Review fetch event handler in sw.js
- Test with DevTools offline mode first

### Issue: Icons don't display correctly
**Solution:**
- Verify icon files exist in /public/icons/
- Check manifest.json icon paths are correct
- Ensure icon sizes match manifest declarations
- Test with different icon sizes

### Issue: Service worker won't update
**Solution:**
- Change CACHE_NAME version in sw.js
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Unregister service worker and reload
- Clear browser cache

---

## Deployment Checklist

Before deploying to production:

- [ ] Update manifest.json with production URL
- [ ] Generate all required icon sizes
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Run Lighthouse PWA audit
- [ ] Verify HTTPS is enabled
- [ ] Test offline functionality
- [ ] Check service worker caching strategy
- [ ] Verify splash screens display correctly
- [ ] Test app shortcuts work correctly

---

## Browser Support

### Fully Supported
- ✅ Chrome 90+ (Desktop & Mobile)
- ✅ Edge 90+ (Desktop & Mobile)
- ✅ Safari 15+ (iOS & macOS)
- ✅ Samsung Internet 14+
- ✅ Firefox 90+ (Desktop)

### Partially Supported
- ⚠️ Firefox Mobile (No install prompt)
- ⚠️ Opera Mobile (Limited features)

### Not Supported
- ❌ Internet Explorer (All versions)
- ❌ Safari < 11.1

---

## Next Steps

1. **Deploy to Production**
   - Deploy to Vercel/Netlify with HTTPS
   - Update manifest.json with production URL
   - Test on real devices

2. **Generate Screenshots**
   - Create home screen screenshot
   - Create quiz interface screenshot
   - Add to manifest.json

3. **Monitor Performance**
   - Set up analytics for PWA installs
   - Track offline usage
   - Monitor service worker errors

4. **Continuous Improvement**
   - Add push notifications
   - Implement background sync
   - Add periodic background sync
   - Optimize cache strategy

---

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Lighthouse PWA Audit](https://web.dev/lighthouse-pwa/)

---

**Status:** Ready for testing

