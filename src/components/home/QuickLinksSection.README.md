# QuickLinksSection Component

## Overview

The `QuickLinksSection` component displays a grid of quick access cards for frequently used features in the Sophia Prep application. It provides rapid navigation to Study Past Questions, Video Lessons, Novels, and Study Hub.

## Requirements

Implements requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4

## Features

- **Four Quick Link Cards**: Study Past Questions, Video Lessons, Novels, Study Hub
- **Responsive Grid Layout**: 
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 4 columns
- **Section Header**: With optional expand action button
- **Pastel Color Scheme**: Each card uses distinct pastel background colors
- **Navigation**: Clicking cards navigates to corresponding feature pages

## Props

```typescript
interface QuickLinksSectionProps {
  onExpandClick?: () => void;  // Optional handler for section expand action
  className?: string;           // Additional CSS classes for customization
}
```

## Usage

```tsx
import { QuickLinksSection } from './components/home/QuickLinksSection';

// Basic usage
<QuickLinksSection />

// With expand action
<QuickLinksSection 
  onExpandClick={() => console.log('Expand clicked')} 
/>

// With custom styling
<QuickLinksSection className="my-custom-class" />
```

## Quick Links

The section includes these four cards:

1. **Study Past Questions**
   - Icon: BookOpen
   - Color: Sky Blue pastel
   - Route: `/subjects`

2. **Video Lessons**
   - Icon: Video
   - Color: Lavender pastel
   - Route: `/videos`

3. **Novels**
   - Icon: BookMarked
   - Color: Soft Yellow pastel
   - Route: `/novels`

4. **Study Hub**
   - Icon: GraduationCap
   - Color: Mint Green pastel
   - Route: `/study-hub`

## Responsive Behavior

- **Mobile (< 640px)**: Single column layout
- **Tablet (640px - 1023px)**: Two column grid
- **Desktop (≥ 1024px)**: Four column grid

## Accessibility

- Semantic HTML structure with `<section>` element
- Keyboard navigation support through QuickLinkCard components
- ARIA labels on interactive elements
- Proper heading hierarchy

## Design Tokens

Uses the following design tokens:
- `--color-sky-blue`: Sky blue pastel background
- `--color-lavender`: Lavender pastel background
- `--color-soft-yellow`: Soft yellow pastel background
- `--color-mint-green`: Mint green pastel background
- `--color-primary-blue`: Blue icon color
- `--color-primary-purple`: Purple icon color
- `--color-primary-orange`: Orange icon color
- `--color-primary-green`: Green icon color

## Related Components

- `SectionHeader`: Displays the section title and action button
- `QuickLinkCard`: Individual card component for each quick link
