# Implementation Plan: Modern UI Redesign

## Task List

- [x] 1. Set up design system and base styles





  - Create CSS custom properties for the new color palette (primary blue, orange, green, purple, pastel accents)
  - Define typography scale and font weights in CSS variables
  - Set up spacing system based on 4px base unit
  - Create animation utility classes for transitions and micro-interactions
  - Update Tailwind config with new design tokens
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 12.5_

- [x] 2. Create reusable card components





  - Implement base FeatureCard component with props for title, description, icon, colors, and onClick
  - Add hover effects with scale and shadow transitions
  - Ensure cards have rounded corners (16px) and proper padding
  - Create icon container with circular background
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ]* 2.1 Write property test for FeatureCard
  - **Property 6: Quiz mode cards contain required elements**
  - **Validates: Requirements 3.3**

- [ ]* 2.2 Write property test for card icon containers
  - **Property 19: Icons in circular containers**
  - **Validates: Requirements 10.5**

- [x] 3. Build Header component





  - Create Header component with greeting text and action icons
  - Implement logic to display user name when logged in, "Guest" when not
  - Add cart and notification icons in top-right corner
  - Add notification badge when count > 0
  - Style with proper typography (text-3xl, bold for greeting)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 3.1 Write property test for greeting with user name
  - **Property 1: Greeting displays user name**
  - **Validates: Requirements 1.1**

- [ ]* 3.2 Write property test for header action icons
  - **Property 2: Header includes action icons**
  - **Validates: Requirements 1.4**

- [x] 4. Implement HeroBanner component





  - Create HeroBanner component with title, description, button, and gradient background
  - Add props for customizable gradient colors
  - Implement button click handler for navigation
  - Style with rounded corners, padding, and shadow
  - Add optional icon support
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property test for hero banner elements
  - **Property 3: Hero banner contains required elements**
  - **Validates: Requirements 2.2**

- [ ]* 4.2 Write property test for hero banner navigation
  - **Property 4: Hero banner navigation**
  - **Validates: Requirements 2.3**

- [x] 5. Create SectionHeader component





  - Build SectionHeader with title and optional action button
  - Implement flex layout with space-between alignment
  - Style with bold text (text-xl) and proper margins
  - Add click handler for action button
  - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [ ]* 5.1 Write property test for section headers
  - **Property 25: Section headers include titles**
  - **Validates: Requirements 14.1**

- [ ]* 5.2 Write property test for expandable sections
  - **Property 26: Expandable sections have action buttons**
  - **Validates: Requirements 14.2**

- [x] 6. Build QuizModeCard component





  - Create specialized card for Practice Mode and CBT Quiz
  - Add icon, title, and description layout
  - Use orange background for Practice Mode, green for CBT Quiz
  - Implement click handler for navigation to quiz interface
  - Add descriptive text about each mode's behavior
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ]* 6.1 Write property test for quiz mode navigation
  - **Property 7: Quiz mode card navigation**
  - **Validates: Requirements 3.4**

- [x] 7. Implement QuizModesSection component





  - Create section container with SectionHeader
  - Render both Practice Mode and CBT Quiz cards
  - Implement responsive grid (1 column mobile, 2 columns tablet/desktop)
  - Add section action button for expanding
  - _Requirements: 3.1, 3.2_

- [ ]* 7.1 Write property test for quiz modes section
  - **Property 5: Quiz Modes section has both modes**
  - **Validates: Requirements 3.2**
-

- [x] 8. Create QuickLinkCard component




  - Build square/rectangular card with centered icon and title
  - Use pastel background colors (mint green, lavender, sky blue, soft yellow)
  - Implement click handler for navigation
  - Ensure 1:1 or 4:3 aspect ratio
  - _Requirements: 4.3, 4.4_

- [ ]* 8.1 Write property test for quick link cards
  - **Property 8: Quick link cards contain required elements**
  - **Validates: Requirements 4.3**

- [ ]* 8.2 Write property test for quick link navigation
  - **Property 9: Quick link navigation**
  - **Validates: Requirements 4.4**





- [ ] 9. Build QuickLinksSection component

  - Create section with SectionHeader
  - Render grid of QuickLinkCards (Study Past Questions, Video Lessons, Novels, Study Hub)
  - Implement responsive grid (1 column mobile, 2 columns tablet, 2-4 columns desktop)
  - Ensure minimum of 4 cards displayed
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4_


- [ ]* 9.1 Write property test for quick links minimum count
  - **Property 10: Quick Links minimum count**
  - **Validates: Requirements 4.5**

- [x] 10. Create EventCard component

  - Build horizontal card with date badge and event information
  - Format date display (e.g., "31 Dec, 2025")
  - Add event type indicator (exam, deadline, announcement)
  - Style with appropriate colors and spacing




  - _Requirements: 6.2, 6.3_

- [ ]* 10.1 Write property test for event cards
  - **Property 11: Event cards display dates**
  - **Validates: Requirements 6.2**

- [ ] 11. Implement UpcomingEventsSection component

  - Create section with SectionHeader and "View All" link

  - Render EventCards for upcoming events
  - Show "View All" link when more than 3 events exist
  - Implement responsive layout (1 column mobile, 2-3 columns desktop)
  - Add navigation handler for "View All"
  - _Requirements: 6.1, 6.4, 6.5_

- [ ]* 11.1 Write property test for View All link
  - **Property 12: View All link appears with multiple events**
  - **Validates: Requirements 6.4**

- [x] 12. Build BottomNavigation component



  - Create fixed bottom navigation bar with 5 items (Home, Study, Test, Chat, More)
  - Add icons and labels for each navigation item
  - Implement active state highlighting based on current route
  - Style with white background, subtle shadow, and 64px height
  - Add safe area insets for mobile devices
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 12.1 Write property test for bottom navigation presence
  - **Property 13: Bottom navigation on all screens**
  - **Validates: Requirements 7.1**

- [ ]* 12.2 Write property test for navigation item count
  - **Property 14: Bottom navigation has five items**
  - **Validates: Requirements 7.2**

- [ ]* 12.3 Write property test for navigation items structure
  - **Property 15: Navigation items have icons and labels**
  - **Validates: Requirements 7.3**

- [ ]* 12.4 Write property test for navigation click handling
  - **Property 16: Navigation item click triggers route change**
  - **Validates: Requirements 7.4**

- [ ]* 12.5 Write property test for active navigation state
  - **Property 17: Active navigation item is highlighted**
  - **Validates: Requirements 7.5**


- [x] 13. Redesign HomePage component



  - Restructure HomePage to use new component architecture
  - Add Header at the top
  - Include HeroBanner below header
  - Add QuizModesSection
  - Add QuickLinksSection
  - Add UpcomingEventsSection
  - Ensure proper spacing between sections (32px)
  - Add page padding (16px mobile, 24px tablet, 32px desktop)
  - _Requirements: All requirements integrated_

- [ ] 14. Implement responsive layouts




  - Add responsive grid classes for all card sections
  - Test mobile layout (single column)
  - Test tablet layout (2 columns)
  - Test desktop layout (multi-column)
  - Ensure cards adjust size and spacing appropriately
  - Verify touch targets are minimum 44px × 44px
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 14.1 Write property test for touch target sizes
  - **Property 20: Touch targets meet minimum size**
  - **Validates: Requirements 11.5**

- [ ] 15. Add animations and transitions



  - Implement card hover effects (scale 1.02, shadow increase)
  - Add fade-in animations for card loading with stagger delay
  - Implement smooth page transitions
  - Add active state animation for bottom navigation
  - Ensure all transitions use 200ms ease-out timing
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
-

- [ ] 16. Implement accessibility features


  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works for all components
  - Verify color contrast meets WCAG AA standards (4.5:1 minimum)
  - Add focus indicators for keyboard users
  - Test with screen reader
  - _Requirements: 9.3_

- [ ]* 16.1 Write property test for color contrast
  - **Property 18: Color contrast meets accessibility standards**
  - **Validates: Requirements 9.3**
-

- [ ] 17. Optimize performance


  - Implement lazy loading for below-the-fold images
  - Add loading skeletons for card components
  - Set up caching for static assets (images, icons)
  - Optimize bundle size with code splitting
  - Ensure home screen loads within 2 seconds
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 17.1 Write property test for image lazy loading
  - **Property 22: Images use lazy loading**
  - **Validates: Requirements 13.2**

- [ ]* 17.2 Write property test for loading skeletons
  - **Property 23: Loading states show skeletons**
  - **Validates: Requirements 13.4**

- [ ]* 17.3 Write property test for asset caching
  - **Property 24: Assets are cached**
  - **Validates: Requirements 13.5**

- [ ]* 17.4 Write property test for performance budget
  - **Property 21: Home screen loads within performance budget**
  - **Validates: Requirements 13.1**

- [ ] 18. Integrate BottomNavigation across all pages



  - Add BottomNavigation to App.tsx or Layout component
  - Ensure it appears on all pages
  - Test navigation between pages
  - Verify active state updates correctly
  - _Requirements: 7.1_
-

- [ ] 19. Create LoadingSkeleton component


  - Build skeleton placeholder for cards
  - Match skeleton dimensions to actual card sizes
  - Add shimmer animation effect
  - Use in all sections during data loading
  - _Requirements: 13.4_


- [ ] 20. Update routing and navigation


  - Ensure all card clicks navigate to correct routes
  - Update route definitions if needed
  - Test navigation flow from home to all features
  - Verify back navigation works correctly
  - _Requirements: 2.3, 3.4, 4.4, 6.5, 7.4_

- [ ]* 20.1 Write property test for section action handlers
  - **Property 27: Section action buttons trigger handlers**
  - **Validates: Requirements 14.3**
-

- [ ] 21. Final testing and polish


  - Test on multiple devices (mobile, tablet, desktop)
  - Verify all animations are smooth
  - Check all colors match design system
  - Ensure consistent spacing throughout
  - Test with different user states (logged in, logged out)
  - Verify error states and edge cases
  - _Requirements: All requirements_

- [ ] 22. Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
