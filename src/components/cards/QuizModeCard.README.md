# QuizModeCard Component

A specialized card component for displaying quiz modes (Practice Mode and CBT Quiz) with distinct color coding and descriptive information.

## Overview

The `QuizModeCard` component is part of the modern UI redesign for Sophia Prep. It provides a consistent, accessible way to display quiz mode options with appropriate visual styling and behavior descriptions.

## Features

- **Mode-specific styling**: Orange theme for Practice Mode, green theme for CBT Quiz
- **Icon support**: Displays icons in circular containers with mode-specific colors
- **Descriptive content**: Shows title and detailed description of each mode's behavior
- **Click handling**: Navigates to the corresponding quiz interface
- **Keyboard accessible**: Supports Enter and Space key navigation
- **Responsive design**: Works well on mobile, tablet, and desktop

## Requirements Satisfied

- **3.3**: Quiz mode cards include icon, title, and description
- **3.4**: Cards navigate to corresponding quiz interface on click
- **3.5**: Practice Mode card indicates explanations after each question
- **3.6**: CBT Quiz card indicates timed JAMB/WAEC past questions

## Usage

### Basic Example

```tsx
import { QuizModeCard } from '@/components/cards';
import { BookOpen, ClipboardCheck } from 'lucide-react';

function QuizModesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <QuizModeCard
        mode="practice"
        icon={<BookOpen size={28} />}
        title="Practice Mode"
        description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually."
        onClick={() => navigate('/practice-mode')}
      />
      
      <QuizModeCard
        mode="cbt"
        icon={<ClipboardCheck size={28} />}
        title="CBT Quiz (Past Questions)"
        description="Timed quiz simulating real JAMB exam conditions with automatic submission after time elapses."
        onClick={() => navigate('/cbt-quiz')}
      />
    </div>
  );
}
```

### With React Router

```tsx
import { useNavigate } from 'react-router-dom';
import { QuizModeCard } from '@/components/cards';

function HomePage() {
  const navigate = useNavigate();

  return (
    <section>
      <h2>Choose Your Quiz Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuizModeCard
          mode="practice"
          icon={<BookOpen size={28} />}
          title="Practice Mode"
          description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually with a submit button."
          onClick={() => navigate('/practice-mode')}
        />
        
        <QuizModeCard
          mode="cbt"
          icon={<ClipboardCheck size={28} />}
          title="CBT Quiz (Past Questions)"
          description="Timed quiz simulating real JAMB/WAEC exam conditions with automatic submission after time elapses (2hr 30min for JAMB). No explanations shown until after completion."
          onClick={() => navigate('/cbt-quiz')}
        />
      </div>
    </section>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mode` | `'practice' \| 'cbt'` | Yes | The quiz mode type, determines color scheme |
| `icon` | `React.ReactNode` | Yes | Icon element to display (typically 28px size) |
| `title` | `string` | Yes | The title of the quiz mode |
| `description` | `string` | Yes | Descriptive text about the mode's behavior |
| `onClick` | `() => void` | Yes | Click handler for navigation to quiz interface |
| `className` | `string` | No | Additional CSS classes for customization |

## Color Schemes

### Practice Mode (`mode="practice"`)
- **Icon Background**: Pastel peach/orange (`--color-pastel-peach`)
- **Icon Color**: Primary orange (`--color-primary-orange`)
- **Card Background**: White (`--color-bg-card`)

### CBT Quiz (`mode="cbt"`)
- **Icon Background**: Pastel mint/green (`--color-pastel-mint`)
- **Icon Color**: Primary green (`--color-primary-green`)
- **Card Background**: White (`--color-bg-card`)

## Accessibility

- **Role**: `button` - Indicates the card is interactive
- **Keyboard Navigation**: Supports Enter and Space keys
- **Tab Index**: `0` - Included in keyboard navigation flow
- **ARIA Label**: Combines title and description for screen readers
- **Focus Management**: Receives focus and shows focus indicators

## Styling

The component uses:
- **Border Radius**: 16px (rounded-2xl)
- **Padding**: 24px (p-6)
- **Shadow**: Subtle shadow that increases on hover
- **Transition**: 200ms ease-out for smooth interactions
- **Hover Effect**: Applied via `card-hover` class (scale + shadow)

## Design Tokens

The component uses the following design tokens from `design-tokens.css`:

```css
--color-pastel-peach: 32 98% 88%;  /* Orange for Practice Mode */
--color-pastel-mint: 152 81% 90%;  /* Green for CBT Quiz */
--color-primary-orange: 20 95% 53%;
--color-primary-green: 158 64% 52%;
--color-bg-card: 0 0% 100%;
--color-text-primary: 215 25% 27%;
--color-text-secondary: 215 16% 47%;
```

## Responsive Behavior

The component is designed to work in various layouts:

- **Mobile**: Single column, full width
- **Tablet**: 2-column grid
- **Desktop**: 2-column grid or horizontal layout

Example responsive grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <QuizModeCard mode="practice" {...props} />
  <QuizModeCard mode="cbt" {...props} />
</div>
```

## Testing

The component includes comprehensive tests covering:
- Rendering with both mode types
- Click handling
- Keyboard navigation (Enter and Space keys)
- Accessibility attributes
- Required elements (icon, title, description)
- Custom className application

Run tests with:
```bash
npm test -- QuizModeCard.test.tsx
```

## Related Components

- **FeatureCard**: Generic card component for other features
- **QuickLinkCard**: Square cards for quick access features
- **SectionHeader**: Header component for quiz modes section

## Examples

See `QuizModeCard.example.tsx` for complete usage examples including:
- Individual card examples
- Grid layouts
- Stacked layouts for mobile
- Integration with navigation

## Notes

- Icons should be approximately 28px for optimal display
- Descriptions should clearly explain the mode's behavior per requirements 3.5 and 3.6
- The component automatically handles color schemes based on the `mode` prop
- Always provide meaningful descriptions that help users understand the difference between modes
