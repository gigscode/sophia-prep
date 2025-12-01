# EventCard Component

A horizontal card component for displaying upcoming events with date badges and type indicators.

## Requirements

- **6.2**: Display event cards with dates
- **6.3**: Include event date and relevant information

## Features

- **Date Badge**: Square badge displaying day and month in a visually distinct format
- **Event Type Indicator**: Color-coded dot and label for event type (exam, deadline, announcement)
- **Horizontal Layout**: Optimized for displaying multiple events in a list or grid
- **Type-Specific Styling**: Different color schemes for different event types
- **Optional Click Handler**: Can be interactive or display-only
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Props

```typescript
interface EventCardProps {
  title: string;              // Event title
  date: Date;                 // Event date (Date object)
  description?: string;       // Optional event description
  type: 'exam' | 'deadline' | 'announcement'; // Event type
  onClick?: () => void;       // Optional click handler
  className?: string;         // Additional CSS classes
}
```

## Event Types

### Exam
- **Color**: Green (mint pastel background)
- **Use Case**: Exam dates, test schedules, mock exams
- **Example**: "JAMB UTME 2025", "WAEC Exam"

### Deadline
- **Color**: Orange (peach pastel background)
- **Use Case**: Registration deadlines, payment due dates, submission deadlines
- **Example**: "Registration Deadline", "Payment Due"

### Announcement
- **Color**: Blue (sky pastel background)
- **Use Case**: General announcements, updates, information
- **Example**: "New Study Materials", "Holiday Notice"

## Usage Examples

### Basic Event Card

```tsx
import { EventCard } from '@/components/cards';

<EventCard
  title="JAMB UTME 2025"
  date={new Date('2025-05-15')}
  description="Joint Admissions and Matriculation Board exam"
  type="exam"
  onClick={() => console.log('Event clicked')}
/>
```

### Event without Description

```tsx
<EventCard
  title="Registration Deadline"
  date={new Date('2025-03-31')}
  type="deadline"
  onClick={() => navigate('/register')}
/>
```

### Non-Interactive Event

```tsx
<EventCard
  title="School Holiday"
  date={new Date('2025-12-25')}
  description="Christmas holiday - no classes"
  type="announcement"
/>
```

### Events in a Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <EventCard
    title="JAMB Mock Exam"
    date={new Date('2025-04-10')}
    type="exam"
    onClick={handleEventClick}
  />
  <EventCard
    title="Payment Deadline"
    date={new Date('2025-03-01')}
    type="deadline"
    onClick={handleEventClick}
  />
  <EventCard
    title="Results Release"
    date={new Date('2025-06-30')}
    type="announcement"
    onClick={handleEventClick}
  />
</div>
```

## Styling

The component uses the design system tokens for consistent styling:

- **Border Radius**: 16px (rounded-2xl)
- **Shadow**: Subtle shadow (shadow-sm)
- **Padding**: 16px (p-4)
- **Date Badge**: 64px × 64px square with rounded corners
- **Hover Effect**: Scale and shadow increase (when clickable)
- **Transition**: 200ms ease-out

## Accessibility

- Proper ARIA labels describing the event
- Keyboard navigation support (Enter and Space keys)
- Appropriate role attributes (button when clickable)
- Color contrast meets WCAG AA standards
- Touch targets meet minimum 44px requirement

## Date Formatting

The component automatically formats dates in the following ways:

- **Date Badge**: Day number (e.g., "31") and month abbreviation (e.g., "Dec")
- **ARIA Label**: Full date format (e.g., "31 Dec, 2025")

## Responsive Behavior

The component is designed to work well in various layouts:

- **Mobile**: Single column, full width
- **Tablet**: 2-column grid
- **Desktop**: 2-3 column grid or horizontal scroll

## Integration with UpcomingEventsSection

This component is designed to be used within the UpcomingEventsSection component:

```tsx
import { EventCard } from '@/components/cards';

function UpcomingEventsSection({ events }) {
  return (
    <section>
      <SectionHeader title="Upcoming Events" />
      <div className="space-y-4">
        {events.map(event => (
          <EventCard
            key={event.id}
            title={event.title}
            date={event.date}
            description={event.description}
            type={event.type}
            onClick={() => handleEventClick(event.id)}
          />
        ))}
      </div>
    </section>
  );
}
```

## Design Decisions

1. **Horizontal Layout**: Chosen for better readability and to accommodate longer event titles
2. **Date Badge**: Square format with day/month provides quick visual scanning
3. **Type Indicator**: Small dot and label provide clear categorization without overwhelming the design
4. **Color Coding**: Uses semantic colors from the design system to create visual associations
5. **Optional Click**: Supports both interactive and display-only use cases
6. **Truncation**: Title truncates with ellipsis to prevent layout breaking

## Future Enhancements

- Add time display for events with specific times
- Support for recurring events
- Add calendar integration
- Support for event status (upcoming, ongoing, completed)
- Add reminder/notification functionality
