# Responsive Layout Implementation

## Overview

This document describes the responsive layout implementation for the Sophia Prep Modern UI Redesign. The implementation ensures that all components work seamlessly across mobile, tablet, and desktop devices while meeting accessibility standards.

**Requirements Addressed:**
- 11.1: Mobile layout (single column)
- 11.2: Tablet layout (2 columns)
- 11.3: Desktop layout (multi-column)
- 11.4: Cards adjust size and spacing appropriately
- 11.5: Touch targets meet minimum 44px × 44px

## Breakpoints

The application uses the following responsive breakpoints:

- **Mobile**: 0px - 639px (default, single column)
- **Tablet**: 640px - 1023px (sm, md - 2 columns)
- **Desktop**: 1024px+ (lg, xl, 2xl - multi-column)

These breakpoints align with Tailwind CSS defaults and are defined in:
- `src/styles/design-tokens.css`
- `tailwind.config.ts`

## Responsive Grid Layouts

### Quiz Modes Grid
- **Mobile**: 1 column (stacked vertically)
- **Tablet**: 2 columns
- **Desktop**: 2 columns

**Usage:**
```tsx
<div className="quiz-modes-grid">
  <QuizModeCard mode="practice" {...props} />
  <QuizModeCard mode="cbt" {...props} />
</div>
```

**CSS Class:** `.quiz-modes-grid`

### Quick Links Grid
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 4 columns

**Usage:**
```tsx
<div className="quick-links-grid">
  <QuickLinkCard {...props} />
  <QuickLinkCard {...props} />
  <QuickLinkCard {...props} />
  <QuickLinkCard {...props} />
</div>
```

**CSS Class:** `.quick-links-grid`

### Events Grid
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns

**Usage:**
```tsx
<div className="events-grid">
  <EventCard {...props} />
  <EventCard {...props} />
  <EventCard {...props} />
</div>
```

**CSS Class:** `.events-grid`

### Generic Responsive Grid
For other card sections that need responsive behavior:

**Usage:**
```tsx
<div className="responsive-grid-cards">
  {/* Cards will automatically adjust based on screen size */}
</div>
```

**CSS Class:** `.responsive-grid-cards`

## Touch Target Requirements

All interactive elements meet WCAG AA accessibility standards with minimum touch target sizes of 44px × 44px.

### Touch Target Classes

#### 1. Basic Touch Target
Ensures minimum 44px × 44px dimensions:
```tsx
<button className="touch-target">Button</button>
```

#### 2. Interactive Touch Target
For inline interactive elements with flex centering:
```tsx
<button className="touch-target-interactive">
  View All
</button>
```

#### 3. Icon Button Touch Target
For icon-only buttons:
```tsx
<button className="icon-button-touch-target" aria-label="Cart">
  <ShoppingCart />
</button>
```

#### 4. Button Touch Target
For standard buttons with padding:
```tsx
<button className="button-touch-target">
  Get Started
</button>
```

#### 5. Card Touch Target
For entire cards that are clickable:
```tsx
<div className="card-touch-target" role="button">
  Card content
</div>
```

## Card Responsive Behavior

### Card Container
Prevents overflow and ensures proper sizing:
```tsx
<div className="card-container">
  {/* Card content */}
</div>
```

### Card Height Responsive
Adjusts minimum height based on screen size:
- Mobile: 120px
- Tablet: 140px
- Desktop: 160px

```tsx
<div className="card-height-responsive">
  {/* Card content */}
</div>
```

## Responsive Spacing

### Page Padding
Automatically adjusts padding based on screen size:
- Mobile: 16px
- Tablet: 24px
- Desktop: 32px

**Usage:**
```tsx
<div className="page-padding">
  {/* Page content */}
</div>
```

### Section Spacing
Adds consistent 32px margin between sections:
```tsx
<section className="section-spacing">
  {/* Section content */}
</section>
```

### Card Padding Responsive
Adjusts card internal padding:
- Mobile: 16px
- Tablet: 20px
- Desktop: 24px

```tsx
<div className="card-padding-responsive">
  {/* Card content */}
</div>
```

## Responsive Typography

### Responsive Headings
Automatically scale based on screen size:

```tsx
<h1 className="heading-responsive-xl">
  Large Heading
</h1>

<h2 className="heading-responsive-lg">
  Medium Heading
</h2>
```

### Responsive Body Text
```tsx
<p className="text-responsive">
  Body text that scales appropriately
</p>
```

## Mobile-Specific Optimizations

### Prevent Horizontal Overflow
```tsx
<div className="mobile-no-overflow">
  {/* Content that won't cause horizontal scrolling */}
</div>
```

### Full Width on Mobile
```tsx
<div className="mobile-full-width">
  {/* Takes full width on mobile devices */}
</div>
```

### Mobile Compact Padding
Reduces padding on mobile for more content space:
```tsx
<div className="mobile-compact">
  {/* Compact padding on mobile */}
</div>
```

### Mobile Stack
Stacks elements vertically on mobile:
```tsx
<div className="mobile-stack">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Accessibility Features

### Focus Visible Ring
Provides clear focus indicators for keyboard navigation:
```tsx
<button className="focus-visible-ring">
  Accessible Button
</button>
```

This class is automatically applied to all interactive components:
- Cards (QuizModeCard, QuickLinkCard, EventCard, FeatureCard)
- Buttons (Header icons, Hero banner CTA, Section actions)
- Navigation items (BottomNavigation)

### Skip to Main Content
For keyboard users to skip navigation:
```tsx
<a href="#main-content" className="skip-to-main">
  Skip to main content
</a>
```

## Safe Area Insets

Support for mobile devices with notches:

```tsx
<div className="safe-area-inset-bottom">
  {/* Content respects bottom safe area (e.g., iPhone notch) */}
</div>
```

Available classes:
- `.safe-area-inset-top`
- `.safe-area-inset-bottom`
- `.safe-area-inset-left`
- `.safe-area-inset-right`

## Aspect Ratios

Maintain consistent aspect ratios for cards:

```tsx
<div className="aspect-square">
  {/* 1:1 square card */}
</div>

<div className="aspect-4-3">
  {/* 4:3 rectangular card */}
</div>

<div className="aspect-16-9">
  {/* 16:9 widescreen card */}
</div>
```

## Container Max-Width

Responsive container with automatic max-width and padding:

```tsx
<div className="container-responsive">
  {/* Content with responsive max-width:
      - Mobile: 100% width
      - sm: 640px max
      - md: 768px max
      - lg: 1024px max
      - xl: 1280px max
      - 2xl: 1536px max
  */}
</div>
```

## Component Updates

All card components have been updated with responsive classes:

### QuizModeCard
- ✅ `card-touch-target` - Minimum 44px touch target
- ✅ `card-container` - Prevents overflow
- ✅ `focus-visible-ring` - Keyboard navigation support

### QuickLinkCard
- ✅ `card-touch-target` - Minimum 44px touch target
- ✅ `card-container` - Prevents overflow
- ✅ `focus-visible-ring` - Keyboard navigation support
- ✅ `aspect-square` or `aspect-4-3` - Maintains aspect ratio

### EventCard
- ✅ `card-touch-target` - Minimum 44px touch target (when clickable)
- ✅ `card-container` - Prevents overflow
- ✅ `focus-visible-ring` - Keyboard navigation support (when clickable)

### FeatureCard
- ✅ `card-touch-target` - Minimum 44px touch target
- ✅ `card-container` - Prevents overflow
- ✅ `focus-visible-ring` - Keyboard navigation support

### Header
- ✅ `icon-button-touch-target` - Cart and notification icons meet 44px minimum
- ✅ `focus-visible-ring` - Keyboard navigation support

### HeroBanner
- ✅ `button-touch-target` - CTA button meets 44px minimum

### SectionHeader
- ✅ `icon-button-touch-target` - Action buttons meet 44px minimum
- ✅ `focus-visible-ring` - Keyboard navigation support

### BottomNavigation
- ✅ `touch-target-interactive` - All nav items meet 44px minimum
- ✅ `focus-visible-ring` - Keyboard navigation support

### HomePage
- ✅ `page-padding` - Responsive page padding
- ✅ `mobile-no-overflow` - Prevents horizontal scrolling

## Testing

All responsive utilities have been tested:
- ✅ Touch target classes apply correctly
- ✅ Responsive grid classes work as expected
- ✅ Card container classes prevent overflow
- ✅ Spacing classes apply appropriate padding
- ✅ Accessibility classes provide focus indicators
- ✅ Mobile-specific classes work correctly
- ✅ Aspect ratio classes maintain proportions

Run tests with:
```bash
npm test responsive.test.tsx -- --run
```

## Browser Support

The responsive implementation supports:
- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## Performance Considerations

- CSS Grid is used for responsive layouts (better performance than flexbox for grids)
- Media queries are mobile-first (default styles for mobile, progressively enhanced)
- Touch target sizes are enforced via CSS classes (no JavaScript required)
- Reduced motion preferences are respected via `@media (prefers-reduced-motion: reduce)`

## Future Enhancements

Potential improvements for future iterations:
- Container queries for component-level responsiveness
- Dynamic viewport units (dvh, dvw) for better mobile support
- Responsive images with srcset and sizes attributes
- Intersection Observer for lazy loading animations
- CSS containment for improved rendering performance

## References

- Design Document: `.kiro/specs/modern-ui-redesign/design.md`
- Requirements Document: `.kiro/specs/modern-ui-redesign/requirements.md`
- Design Tokens: `src/styles/design-tokens.css`
- Responsive Utilities: `src/styles/responsive.css`
- Tailwind Config: `tailwind.config.ts`
