# FeatureCard Component

A reusable card component for the Sophia Prep modern UI redesign. This component implements the design specifications for feature cards, quiz mode cards, and quick link cards.

## Features

- ✅ Rounded corners (16px) for modern appearance
- ✅ Subtle shadow with hover effects (scale + shadow increase)
- ✅ Circular icon container with customizable background color
- ✅ Three size variants: small, medium, large
- ✅ Keyboard accessible (Enter and Space key support)
- ✅ Proper ARIA labels and roles
- ✅ Smooth transitions (200ms ease-out)
- ✅ Responsive and touch-friendly

## Requirements Coverage

This component satisfies the following requirements from the design document:

- **Requirement 10.1**: Rounded corners applied to all cards
- **Requirement 10.2**: Subtle shadow for depth
- **Requirement 10.3**: Hover feedback through shadow and scale changes
- **Requirement 10.5**: Icons displayed in circular containers with background colors

## Usage

```tsx
import { FeatureCard } from '@/components/cards';

function MyComponent() {
  return (
    <FeatureCard
      title="Practice Mode"
      description="Familiarize yourself with exam questions"
      icon={<BookIcon />}
      iconBackgroundColor="hsl(var(--color-pastel-peach))"
      onClick={() => navigate('/practice')}
      size="large"
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | Main title text displayed on the card |
| `description` | `string` | No | - | Optional description text below the title |
| `icon` | `React.ReactNode` | Yes | - | Icon element to display |
| `iconBackgroundColor` | `string` | Yes | - | Background color for the circular icon container (HSL format) |
| `backgroundColor` | `string` | No | `hsl(var(--color-bg-card))` | Background color for the card |
| `onClick` | `() => void` | Yes | - | Click handler function |
| `size` | `'small' \| 'medium' \| 'large'` | No | `'medium'` | Card size variant |
| `className` | `string` | No | `''` | Additional CSS classes |

## Size Variants

### Small
- Padding: 16px (p-4)
- Icon container: 40px (w-10 h-10)
- Title: text-base (16px)
- Best for: Quick link cards in dense grids

### Medium (Default)
- Padding: 20px (p-5)
- Icon container: 48px (w-12 h-12)
- Title: text-lg (18px)
- Best for: Standard feature cards

### Large
- Padding: 24px (p-6)
- Icon container: 56px (w-14 h-14)
- Title: text-xl (20px)
- Best for: Quiz mode cards, hero features

## Color Palette

Use design tokens for consistent colors:

```tsx
// Practice Mode - Orange/Peach
iconBackgroundColor="hsl(var(--color-pastel-peach))"

// CBT Quiz - Green/Mint
iconBackgroundColor="hsl(var(--color-pastel-mint))"

// Study Materials - Lavender
iconBackgroundColor="hsl(var(--color-pastel-lavender))"

// Past Questions - Sky Blue
iconBackgroundColor="hsl(var(--color-pastel-sky))"

// Events - Yellow
iconBackgroundColor="hsl(var(--color-pastel-yellow))"
```

## Accessibility

- Keyboard navigable with Tab key
- Activatable with Enter or Space key
- Proper ARIA labels and roles
- Minimum touch target size (44px) for mobile
- Focus indicators for keyboard users

## Animation

The card uses the `card-hover` class from `animations.css`:
- Hover: Scale 1.02 + increased shadow
- Transition: 200ms ease-out
- Respects `prefers-reduced-motion` for accessibility

## Testing

Unit tests are available in `FeatureCard.test.tsx`:
- Rendering with required props
- Optional description rendering
- Click and keyboard interaction
- Size variant classes
- Accessibility attributes
- Hover effect classes

Run tests:
```bash
npm test -- --run src/components/cards/FeatureCard.test.tsx
```

## Examples

See `FeatureCard.example.tsx` for comprehensive usage examples including:
- Practice Mode card
- CBT Quiz card
- Quick link cards
- Grid layouts
- Different size variants

## Related Components

This component is part of the modern UI redesign and works with:
- `QuizModeCard` - Specialized variant for quiz modes
- `QuickLinkCard` - Specialized variant for quick links
- `EventCard` - Specialized variant for events
- `SectionHeader` - Section titles with action buttons

## Design Tokens

This component uses the following design tokens from `design-tokens.css`:
- `--color-bg-card` - Card background
- `--color-text-primary` - Title text
- `--color-text-secondary` - Description text
- `--radius-lg` - Border radius (16px)
- `--shadow-sm` - Default shadow
- `--shadow-lg` - Hover shadow
- `--transition-base` - Animation timing (200ms)
