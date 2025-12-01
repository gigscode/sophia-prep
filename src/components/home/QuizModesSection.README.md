# QuizModesSection Component

## Overview

The `QuizModesSection` component displays the Quiz Modes section on the home page, featuring both Practice Mode and CBT Quiz cards. It provides users with quick access to different quiz modes for exam preparation.

## Requirements

- **3.1**: Display a "Quiz Modes" section with feature cards
- **3.2**: Display both Practice Mode and CBT Quiz options

## Features

- **Section Header**: Displays "Quiz Modes" title with optional expand action
- **Practice Mode Card**: Orange-themed card for practice quiz mode
- **CBT Quiz Card**: Green-themed card for timed CBT quiz mode
- **Responsive Grid**: 1 column on mobile, 2 columns on tablet/desktop
- **Navigation**: Clicking cards navigates to respective quiz interfaces

## Usage

```tsx
import { QuizModesSection } from '@/components/home';

// Basic usage
<QuizModesSection />

// With expand action
<QuizModesSection 
  onExpandClick={() => console.log('Expand clicked')} 
/>

// With custom styling
<QuizModesSection className="my-custom-class" />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onExpandClick` | `() => void` | No | `undefined` | Handler for section expand action button |
| `className` | `string` | No | `''` | Additional CSS classes |

## Quiz Modes

### Practice Mode
- **Route**: `/practice`
- **Icon**: BookOpen
- **Color**: Orange/Peach
- **Description**: Familiarize yourself with exam questions. See explanations after each answer and time yourself manually with a submit button.

### CBT Quiz (Past Questions)
- **Route**: `/mock-exams`
- **Icon**: Clock
- **Color**: Green/Mint
- **Description**: Timed quiz simulating real JAMB/WAEC exam conditions with automatic submission. No explanations shown until after completion.

## Responsive Behavior

- **Mobile (< 640px)**: Single column layout
- **Tablet/Desktop (≥ 768px)**: Two column grid layout

## Accessibility

- Keyboard navigation supported through QuizModeCard components
- Proper ARIA labels on interactive elements
- Focus management for keyboard users

## Dependencies

- `react-router-dom`: For navigation
- `lucide-react`: For icons (BookOpen, Clock, ChevronRight)
- `SectionHeader`: Section header component
- `QuizModeCard`: Quiz mode card component

## Testing

The component includes comprehensive unit tests covering:
- Rendering of section header and both quiz mode cards
- Expand action button visibility and functionality
- Responsive grid layout classes
- Custom className application
- Navigation integration

Run tests with:
```bash
npm test -- QuizModesSection
```

## Example

See `QuizModesSection.example.tsx` for interactive examples.
