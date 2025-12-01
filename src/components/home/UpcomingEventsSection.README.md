# UpcomingEventsSection Component

## Overview

The `UpcomingEventsSection` component displays upcoming events in a responsive grid layout with EventCards. It automatically shows a "View All" link when more than 3 events are present, allowing users to navigate to a full events listing.

## Requirements

This component satisfies the following requirements:
- **6.1**: Displays "Upcoming Event" section on home screen
- **6.4**: Shows "View All" link when more than 3 events exist
- **6.5**: Navigates to full events calendar/list when "View All" is clicked

## Features

- **Responsive Grid Layout**: 1 column on mobile, 2 columns on tablet, 3 columns on desktop
- **Conditional View All Link**: Automatically appears when more than 3 events exist
- **Event Cards**: Displays events with dates, types, and descriptions
- **Navigation Support**: Handles both individual event clicks and "View All" navigation
- **Empty State Handling**: Renders nothing when no events are provided

## Props

```typescript
interface EventData {
  id: string;
  title: string;
  date: Date;
  description?: string;
  type: 'exam' | 'deadline' | 'announcement';
}

interface UpcomingEventsSectionProps {
  events?: EventData[];
  onViewAllClick?: () => void;
  className?: string;
}
```

### Props Description

- `events` (optional): Array of event data to display. Defaults to empty array.
- `onViewAllClick` (optional): Custom handler for "View All" button. If not provided, navigates to `/events`.
- `className` (optional): Additional CSS classes for customization.

## Usage

### Basic Usage

```tsx
import { UpcomingEventsSection } from '@/components/home';

const events = [
  {
    id: '1',
    title: 'JAMB UTME 2025',
    date: new Date('2025-05-15'),
    description: 'Unified Tertiary Matriculation Examination',
    type: 'exam',
  },
  {
    id: '2',
    title: 'WAEC Registration Deadline',
    date: new Date('2025-03-31'),
    type: 'deadline',
  },
];

function HomePage() {
  return (
    <UpcomingEventsSection events={events} />
  );
}
```

### With Custom View All Handler

```tsx
function HomePage() {
  const handleViewAll = () => {
    // Custom navigation or modal logic
    navigate('/events/calendar');
  };

  return (
    <UpcomingEventsSection 
      events={events} 
      onViewAllClick={handleViewAll}
    />
  );
}
```

### With Custom Styling

```tsx
<UpcomingEventsSection 
  events={events}
  className="my-8 px-4"
/>
```

## Behavior

### View All Link Logic

The "View All" link appears when:
- `events.length > 3`

The link does NOT appear when:
- `events.length <= 3`

### Empty State

When `events` is empty or undefined, the component returns `null` and renders nothing.

### Navigation

- **Individual Event Click**: Navigates to `/events/{eventId}`
- **View All Click**: 
  - Uses `onViewAllClick` handler if provided
  - Otherwise navigates to `/events`

## Responsive Layout

The component uses a responsive grid:

```css
grid-cols-1       /* Mobile: 1 column */
md:grid-cols-2    /* Tablet: 2 columns */
lg:grid-cols-3    /* Desktop: 3 columns */
```

## Event Types

Events support three types with distinct styling:

- **exam**: Green color scheme (mint green background)
- **deadline**: Orange color scheme (peach background)
- **announcement**: Blue color scheme (sky blue background)

## Accessibility

- Section uses semantic HTML with proper heading structure
- "View All" button has `aria-label="View all events"`
- Individual EventCards are keyboard accessible
- Focus management follows standard patterns

## Testing

The component includes comprehensive unit tests covering:
- Section header rendering
- Event card rendering
- View All link conditional display
- Navigation handlers
- Responsive grid layout
- Empty state handling
- Custom className application
- Date and type indicator display

Run tests with:
```bash
npm test -- src/components/home/UpcomingEventsSection.test.tsx --run
```

## Related Components

- `SectionHeader`: Used for the section title
- `EventCard`: Used to display individual events
- `QuickLinksSection`: Similar section component pattern
- `QuizModesSection`: Similar section component pattern

## Design Tokens

The component uses the following design tokens:
- `--color-primary-blue`: View All link color
- `--color-text-primary`: Section title color
- Grid spacing: 16px gap between cards
- Section spacing: 16px between header and content

## Future Enhancements

Potential improvements:
- Pagination for large event lists
- Filtering by event type
- Calendar view integration
- Event reminders/notifications
- Sorting options (by date, type, etc.)
