# BottomNavigation Component

## Overview

The `BottomNavigation` component is a fixed bottom navigation bar that provides quick access to the five primary sections of the Sophia Prep application. It implements the modern UI redesign specifications with proper accessibility, responsive design, and visual feedback.

## Features

- **Fixed Positioning**: Always visible at the bottom of the screen
- **Five Navigation Items**: Home, Study, Test, Chat, and More
- **Active State Highlighting**: Visual indicator for the current section
- **Accessibility**: Full ARIA support and keyboard navigation
- **Mobile-First**: Includes safe area insets for mobile devices
- **Smooth Transitions**: 200ms ease-out animations

## Usage

```tsx
import { BottomNavigation } from '@/components/layout';

function App() {
  return (
    <div>
      {/* Your page content */}
      <BottomNavigation />
    </div>
  );
}
```

## Navigation Items

| Item | Icon | Route | Description |
|------|------|-------|-------------|
| Home | House | `/` | Main landing page |
| Study | Book | `/study` | Study materials and resources |
| Test | Clipboard | `/quiz` | Quiz and practice modes |
| Chat | Message | `/help` | Help center and support |
| More | Menu | `/profile` | User profile and settings |

## Design Specifications

### Styling
- **Height**: 64px (using CSS variable `--bottom-nav-height`)
- **Background**: White with shadow-lg
- **Z-Index**: 1200 (fixed layer)
- **Safe Area**: Includes `env(safe-area-inset-bottom)` for mobile devices

### Active State
- **Color**: Blue-600 (primary blue)
- **Indicator**: Small dot above the icon
- **Font Weight**: Semibold for active item label

### Inactive State
- **Color**: Gray-500
- **Hover**: Gray-700
- **Transition**: 200ms ease-out

## Accessibility

The component follows WCAG AA accessibility standards:

- **ARIA Labels**: Each navigation item has a descriptive `aria-label`
- **ARIA Current**: Active items have `aria-current="page"`
- **Semantic HTML**: Uses `<nav>` element with proper role
- **Keyboard Navigation**: Full keyboard support via native links
- **Screen Reader**: Icons hidden with `aria-hidden="true"`

## Requirements Satisfied

This component satisfies the following requirements from the modern UI redesign specification:

- **7.1**: Fixed bottom navigation bar on all screens
- **7.2**: Five navigation items
- **7.3**: Icons and labels for each item
- **7.4**: Click navigation to corresponding sections
- **7.5**: Active state highlighting based on current route
- **8.1-8.5**: Specific navigation items (Home, Study, Test, Chat, More)

## Testing

The component includes comprehensive unit tests covering:

- Structure and content rendering
- Navigation behavior
- Active state highlighting
- Styling and layout
- Accessibility features
- Responsive behavior

Run tests with:
```bash
npm test src/components/layout/BottomNavigation.test.tsx
```

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Notes

- The component uses React Router's `useLocation` hook to determine the active route
- Route matching uses `startsWith` for nested routes (e.g., `/study/syllabus` activates the Study item)
- The Home route uses exact matching to prevent false positives
- Safe area insets ensure proper spacing on devices with notches or home indicators
