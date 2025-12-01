# Screen Reader Testing Guide

## Overview

This guide provides step-by-step instructions for testing the Sophia Prep application with screen readers to ensure accessibility for users with visual impairments.

## Supported Screen Readers

### Windows
- **NVDA** (NonVisual Desktop Access) - Free, recommended for testing
- **JAWS** (Job Access With Speech) - Commercial, industry standard

### macOS
- **VoiceOver** - Built-in, free

### Mobile
- **VoiceOver** (iOS) - Built-in
- **TalkBack** (Android) - Built-in

## NVDA Testing (Windows)

### Installation
1. Download NVDA from https://www.nvaccess.org/download/
2. Install and restart your computer
3. NVDA will start automatically

### Basic Controls
- **Start/Stop NVDA**: Ctrl + Alt + N
- **Stop Speech**: Ctrl
- **Read Next Item**: Down Arrow
- **Read Previous Item**: Up Arrow
- **Activate Element**: Enter or Space
- **Navigate by Headings**: H (next), Shift + H (previous)
- **Navigate by Links**: K (next), Shift + K (previous)
- **Navigate by Buttons**: B (next), Shift + B (previous)
- **Navigate by Landmarks**: D (next), Shift + D (previous)
- **Navigate by Forms**: F (next), Shift + F (previous)
- **List All Elements**: Insert + F7

### Testing Checklist

#### Home Page
1. **Header Section**
   - [ ] Greeting is announced with user name
   - [ ] Cart button is announced as "Open shopping cart, button"
   - [ ] Notification button announces count when present
   - [ ] All buttons are in the tab order

2. **Hero Banner**
   - [ ] Banner is announced as a region
   - [ ] Title is read correctly
   - [ ] Description is read after title
   - [ ] Call-to-action button is clearly labeled
   - [ ] Button purpose is understandable

3. **Quiz Modes Section**
   - [ ] Section header "Quiz Modes" is announced
   - [ ] Practice Mode card is announced as a button
   - [ ] Card title and description are read
   - [ ] CBT Quiz card is announced similarly
   - [ ] Both cards are keyboard accessible

4. **Quick Links Section**
   - [ ] Section header "Quick Links" is announced
   - [ ] Each card is announced as a button
   - [ ] Card titles are clear and descriptive
   - [ ] All cards are in logical reading order

5. **Upcoming Events Section**
   - [ ] Section header "Upcoming Events" is announced
   - [ ] Event dates are read in accessible format
   - [ ] Event types (exam, deadline, announcement) are announced
   - [ ] "View All" link is announced when present

6. **Bottom Navigation**
   - [ ] Navigation is announced as "Primary navigation"
   - [ ] All 5 items are announced (Home, Study, Test, Chat, More)
   - [ ] Active item is indicated with "current page"
   - [ ] Icons are hidden from screen reader (aria-hidden)
   - [ ] Labels are clear and descriptive

### Common Issues to Check

#### Missing Labels
- All buttons should have descriptive labels
- Icon-only buttons must have aria-label
- Images should have alt text

#### Incorrect Reading Order
- Content should be read top to bottom, left to right
- Tab order should match visual order
- Hidden content should not be announced

#### Unclear Context
- Links should make sense out of context
- Button purposes should be clear
- Form fields should have associated labels

## VoiceOver Testing (macOS)

### Basic Controls
- **Start/Stop VoiceOver**: Cmd + F5
- **VoiceOver Key**: Ctrl + Option (VO)
- **Read Next Item**: VO + Right Arrow
- **Read Previous Item**: VO + Left Arrow
- **Activate Element**: VO + Space
- **Open Rotor**: VO + U
- **Navigate Headings**: VO + Cmd + H
- **Navigate Links**: VO + Cmd + L
- **Navigate Buttons**: VO + Cmd + B

### Testing with Rotor
1. Open Rotor (VO + U)
2. Use Left/Right arrows to switch categories:
   - Headings
   - Links
   - Form Controls
   - Landmarks
   - Articles
3. Use Up/Down arrows to navigate within category
4. Press Enter to jump to selected item

### Testing Checklist

#### Navigation
- [ ] All interactive elements appear in Rotor
- [ ] Headings are properly nested (H1 → H2 → H3)
- [ ] Landmarks are properly labeled
- [ ] Links are descriptive

#### Interactive Elements
- [ ] All buttons are announced with their purpose
- [ ] Cards are announced as buttons when clickable
- [ ] Form controls have associated labels
- [ ] Error messages are announced

#### Dynamic Content
- [ ] Live regions announce updates
- [ ] Loading states are announced
- [ ] Success/error messages are announced
- [ ] Navigation changes are announced

## Mobile Testing

### VoiceOver (iOS)

#### Basic Gestures
- **Enable VoiceOver**: Settings → Accessibility → VoiceOver
- **Navigate**: Swipe right (next), swipe left (previous)
- **Activate**: Double-tap
- **Rotor**: Rotate two fingers on screen
- **Scroll**: Three-finger swipe up/down

#### Testing Checklist
- [ ] All touch targets are at least 44×44 points
- [ ] Swipe gestures navigate in logical order
- [ ] Double-tap activates elements correctly
- [ ] Rotor provides quick navigation
- [ ] Custom gestures don't interfere with VoiceOver

### TalkBack (Android)

#### Basic Gestures
- **Enable TalkBack**: Settings → Accessibility → TalkBack
- **Navigate**: Swipe right (next), swipe left (previous)
- **Activate**: Double-tap
- **Context Menu**: Swipe up then right
- **Scroll**: Two-finger swipe up/down

#### Testing Checklist
- [ ] All elements are announced clearly
- [ ] Touch exploration works correctly
- [ ] Gestures are responsive
- [ ] Reading order is logical
- [ ] Custom views are accessible

## Testing Scenarios

### Scenario 1: New User Journey
1. Start at home page
2. Navigate through greeting
3. Explore hero banner
4. Navigate to Practice Mode
5. Return to home
6. Navigate to Quick Links
7. Select Study Hub

**Expected Behavior**:
- All elements are announced clearly
- Navigation is logical and predictable
- User can complete task without visual reference
- Feedback is provided for all actions

### Scenario 2: Returning User
1. Start at home page with notifications
2. Check notification count
3. Navigate to CBT Quiz
4. Review upcoming events
5. Use bottom navigation to switch sections

**Expected Behavior**:
- Notification count is announced
- Active navigation item is indicated
- Section changes are announced
- User maintains context throughout

### Scenario 3: Keyboard-Only Navigation
1. Use Tab to navigate through page
2. Use Enter/Space to activate elements
3. Use arrow keys in navigation
4. Use Escape to close modals

**Expected Behavior**:
- All interactive elements are reachable
- Focus indicator is visible
- Activation works consistently
- No keyboard traps

## Common Accessibility Issues

### Issue: Button Not Announced
**Symptom**: Screen reader skips over button
**Solution**: 
- Add `role="button"` to div elements
- Add `tabIndex={0}` for keyboard access
- Add `aria-label` for context

### Issue: Unclear Button Purpose
**Symptom**: Button announced as "button" only
**Solution**:
- Add descriptive `aria-label`
- Include visible text label
- Use `aria-describedby` for additional context

### Issue: Incorrect Reading Order
**Symptom**: Content read in wrong order
**Solution**:
- Check DOM order matches visual order
- Use CSS for visual positioning, not DOM order
- Test with screen reader to verify

### Issue: Missing Form Labels
**Symptom**: Form field purpose unclear
**Solution**:
- Associate labels with inputs using `htmlFor`
- Add `aria-label` for icon-only inputs
- Use `aria-describedby` for help text

### Issue: Dynamic Content Not Announced
**Symptom**: Updates happen silently
**Solution**:
- Use `aria-live="polite"` for non-urgent updates
- Use `aria-live="assertive"` for urgent updates
- Use `aria-atomic="true"` to read entire region

## Reporting Issues

When reporting screen reader issues, include:

1. **Screen Reader**: Name and version
2. **Browser**: Name and version
3. **Operating System**: Name and version
4. **Steps to Reproduce**: Detailed steps
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **WCAG Criterion**: Which guideline is violated

### Example Report

```
Screen Reader: NVDA 2023.1
Browser: Chrome 120
OS: Windows 11

Steps:
1. Navigate to home page
2. Tab to notification button
3. Press Enter

Expected: Notification panel opens and focus moves to panel
Actual: Panel opens but focus remains on button

WCAG: 2.4.3 Focus Order (Level A)
```

## Resources

### Documentation
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Training
- [WebAIM Screen Reader Simulation](https://webaim.org/simulations/screenreader)
- [Deque University](https://dequeuniversity.com/)
- [A11ycasts with Rob Dodson](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)

### Communities
- [WebAIM Discussion List](https://webaim.org/discussion/)
- [A11y Slack](https://web-a11y.slack.com/)
- [Accessibility Subreddit](https://www.reddit.com/r/accessibility/)

## Best Practices

1. **Test Early and Often**: Don't wait until the end
2. **Test with Real Users**: Nothing beats actual user feedback
3. **Test Multiple Screen Readers**: Different tools, different experiences
4. **Test on Mobile**: Mobile screen readers behave differently
5. **Document Issues**: Keep track of what needs fixing
6. **Prioritize Fixes**: Focus on critical issues first
7. **Retest After Fixes**: Verify fixes don't break other things
8. **Automate Where Possible**: Use tools like axe for quick checks

## Conclusion

Screen reader testing is essential for ensuring your application is accessible to all users. Regular testing with multiple screen readers helps identify issues early and ensures a better experience for everyone.

Remember: Accessibility is not a feature, it's a requirement.
