# QuickLinkCard Component

## Overview

The `QuickLinkCard` component is a square or rectangular card designed for quick access to frequently used features in the Sophia Prep application. It features a centered layout with an icon and title, using pastel background colors to create a visually appealing and organized interface.

## Requirements

This component implements the following requirements from the Modern UI Redesign specification:

- **Requirement 4.3**: Quick Link cards display a title and an icon
- **Requirement 4.4**: Clicking a Quick Link card navigates to the corresponding feature page

## Features

- **Flexible Aspect Ratios**: Supports both 1:1 (square) and 4:3 (rectangular) aspect ratios
- **Pastel Color Palette**: Uses the design system's pastel colors (mint green, lavender, sky blue, soft yellow, peach)
- **Centered Layout**: Icon and title are centered for a clean, balanced appearance
- **Hover Effects**: Includes card-hover class for smooth scale and shadow transitions
- **Keyboard Accessible**: Supports Enter and Space key navigation
- **ARIA Labels**: Includes proper accessibility attributes

## Props

```typescript
interface QuickLinkCardProps {
  title: string;              // The title text displayed below the icon
  icon: React.ReactNode;      // React node containing the icon to display
  backgroundColor: string;    // Pastel background color (HSL format)
  iconColor?: string;         // Optional color for the icon
  onClick: () => void;        // Click handler for navigation
  aspectRatio?: '1:1' | '4:3'; // Card aspect ratio (default: '1:1')
  className?: string;         // Additional CSS classes
}
```

## Usage Examples

### Basic Square Card

```tsx
import { QuickLinkCard } from '@/components/cards';
import { BookOpen } from 'lucide-react';

<QuickLinkCard
  title="Study Past Questions"
  icon={<BookOpen size={40} />}
  backgroundColor="hsl(var(--color-pastel-sky))"
  iconColor="hsl(var(--color-primary-blue))"
  onClick={() => navigate('/past-questions')}
/>
```

### Rectangular Card (4:3)

```tsx
<QuickLinkCard
  title="Video Lessons"
  icon={<Video size={40} />}
  backgroundColor="hsl(var(--color-pastel-lavender))"
  iconColor="hsl(var(--color-primary-purple))"
  onClick={() => navigate('/videos')}
  aspectRatio="4:3"
/>
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <QuickLinkCard
    title="Study Past Questions"
    icon={<BookOpen size={40} />}
    backgroundColor="hsl(var(--color-pastel-sky))"
    onClick={() => navigate('/past-questions')}
  />
  <QuickLinkCard
    title="Video Lessons"
    icon={<Video size={40} />}
    backgroundColor="hsl(var(--color-pastel-lavender))"
    onClick={() => navigate('/videos')}
  />
  <QuickLinkCard
    title="Novels"
    icon={<BookMarked size={40} />}
    backgroundColor="hsl(var(--color-pastel-yellow))"
    onClick={() => navigate('/novels')}
  />
  <QuickLinkCard
    title="Study Hub"
    icon={<GraduationCap size={40} />}
    backgroundColor="hsl(var(--color-pastel-mint))"
    onClick={() => navigate('/study-hub')}
  />
</div>
```

## Recommended Pastel Colors

The component works best with the design system's pastel colors:

- **Mint Green**: `hsl(var(--color-pastel-mint))` - For study materials, JAMB CBT
- **Peach**: `hsl(var(--color-pastel-peach))` - For general CBT, warm actions
- **Lavender**: `hsl(var(--color-pastel-lavender))` - For videos, creative content
- **Sky Blue**: `hsl(var(--color-pastel-sky))` - For past questions, academic content
- **Soft Yellow**: `hsl(var(--color-pastel-yellow))` - For events, highlights

## Recommended Icon Colors

Pair pastel backgrounds with corresponding primary colors for icons:

- Mint Green background → Green icon: `hsl(var(--color-primary-green))`
- Peach background → Orange icon: `hsl(var(--color-primary-orange))`
- Lavender background → Purple icon: `hsl(var(--color-primary-purple))`
- Sky Blue background → Blue icon: `hsl(var(--color-primary-blue))`
- Soft Yellow background → Orange icon: `hsl(var(--color-primary-orange))`

## Accessibility

- **Keyboard Navigation**: Supports Enter and Space keys for activation
- **ARIA Labels**: Uses the title as the aria-label for screen readers
- **Touch Targets**: Card dimensions ensure minimum 44px touch target size
- **Focus Indicators**: Inherits focus styles from the design system
- **Role**: Properly marked as a button for assistive technologies

## Styling

The component uses:
- **Border Radius**: 16px (rounded-2xl) for modern appearance
- **Shadow**: Subtle shadow (shadow-sm) with increased shadow on hover
- **Padding**: 24px (p-6) for comfortable spacing
- **Transition**: 200ms ease-out for smooth hover effects
- **Hover Effect**: Scale 1.02 and increased shadow (via card-hover class)

## Responsive Behavior

The component adapts to different screen sizes:
- **Mobile**: Single column layout recommended
- **Tablet**: 2-column grid layout
- **Desktop**: 2-4 column grid layout depending on content

Use Tailwind's responsive grid classes to control layout:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* QuickLinkCards */}
</div>
```

## Design Tokens

The component uses the following design tokens:
- `--color-pastel-*`: Pastel background colors
- `--color-primary-*`: Icon colors
- `--color-text-primary`: Title text color
- `--transition-base`: Hover transition timing
- `--radius-lg`: Border radius

## Related Components

- **FeatureCard**: General-purpose card with description support
- **QuizModeCard**: Specialized card for quiz modes with mode-specific styling
- **SectionHeader**: Used to label sections containing QuickLinkCards

## Examples

See `QuickLinkCard.example.tsx` for complete working examples demonstrating:
- Square cards (1:1 aspect ratio)
- Rectangular cards (4:3 aspect ratio)
- All pastel color variations
- Grid layouts for different screen sizes
