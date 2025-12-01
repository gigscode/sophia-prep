# Home Components

This directory contains components specific to the home page of the Sophia Prep application, part of the Modern UI Redesign.

## Components

### Header

The Header component displays a personalized greeting and action icons for cart and notifications.

**Features:**
- Personalized greeting with user name when logged in
- Generic "Guest" greeting when not logged in
- Cart icon button
- Notification icon button with badge
- Notification count display (shows "99+" for counts over 99)
- Responsive design with proper touch targets
- Accessible with ARIA labels

**Props:**
```typescript
interface HeaderProps {
  userName?: string;           // User's display name
  isLoggedIn: boolean;         // Whether user is authenticated
  onCartClick: () => void;     // Handler for cart icon click
  onNotificationClick: () => void; // Handler for notification icon click
  notificationCount?: number;  // Number of unread notifications (default: 0)
}
```

**Usage:**
```tsx
import { Header } from './components/home/Header';
import { useAuth } from './hooks/useAuth';

function HomePage() {
  const { user } = useAuth();
  
  return (
    <Header
      userName={user?.name}
      isLoggedIn={!!user}
      onCartClick={() => navigate('/cart')}
      onNotificationClick={() => navigate('/notifications')}
      notificationCount={5}
    />
  );
}
```

**Design Specifications:**
- Greeting text: text-3xl (30px), bold (700 weight)
- Icon size: 24px (w-6 h-6)
- Notification badge: Red background (#EF4444), white text
- Touch targets: Minimum 44px × 44px for accessibility
- Spacing: 16px gap between icons

**Requirements Validated:**
- 1.1: Displays user name when logged in
- 1.2: Displays "Guest" when not logged in
- 1.3: Positioned at top of screen
- 1.4: Includes cart and notification icons in top-right

## File Structure

```
src/components/home/
├── Header.tsx           # Main Header component
├── Header.example.tsx   # Usage examples
└── README.md           # This file
```

## Design System

This component uses design tokens from `src/styles/design-tokens.css`:
- Typography: `--text-3xl`, `--font-bold`
- Spacing: `--space-4`, `--space-6`
- Colors: `--color-text-primary`, `--color-error`
- Transitions: `--transition-base`

## Accessibility

- All interactive elements have ARIA labels
- Notification badge includes screen reader text for count
- Touch targets meet WCAG AA minimum size (44px × 44px)
- Keyboard accessible with proper focus states
- Color contrast meets WCAG AA standards

## Future Enhancements

- Add dropdown menu for notifications
- Add cart item count badge
- Support for user avatar image
- Animated notification badge entrance
- Dark mode support


---

### HeroBanner

The HeroBanner component is a prominent promotional card for showcasing important features, promotions, or calls-to-action with a gradient background.

**Features:**
- Customizable gradient background with two colors
- Title, description, and call-to-action button
- Optional icon support with frosted glass effect
- Rounded corners (16px) with shadow for depth
- Hover effects for enhanced interactivity
- Responsive typography and spacing
- Decorative background pattern for visual interest
- Smooth transitions and animations

**Props:**
```typescript
interface HeroBannerProps {
  title: string;              // Main heading text
  description: string;        // Descriptive text
  buttonText: string;         // CTA button label
  buttonAction: () => void;   // Handler for button click
  gradientColors: [string, string]; // [start, end] gradient colors
  icon?: React.ReactNode;     // Optional icon element
}
```

**Usage:**
```tsx
import { HeroBanner } from './components/home/HeroBanner';
import { Sparkles } from 'lucide-react';

function HomePage() {
  return (
    <HeroBanner
      title="Unlock Premium Features"
      description="Get unlimited access to all past questions, video lessons, and personalized study plans."
      buttonText="Subscribe Now"
      buttonAction={() => navigate('/subscribe')}
      gradientColors={['#8B5CF6', '#6366F1']}
      icon={<Sparkles className="w-8 h-8 text-white" />}
    />
  );
}
```

**Gradient Color Examples:**
- **Purple to Blue**: `['#8B5CF6', '#6366F1']` - Premium features, creativity
- **Green to Teal**: `['#10B981', '#059669']` - Success, growth, CBT practice
- **Orange to Red**: `['#F97316', '#DC2626']` - Energy, urgency, challenges
- **Blue to Dark Blue**: `['#3B82F6', '#1D4ED8']` - Trust, academic content
- **Dark Gray**: `['#1F2937', '#111827']` - Professional, elegant announcements

**Design Specifications:**
- Border radius: 16px (rounded-2xl)
- Padding: 24px (p-6)
- Shadow: Medium elevation with hover enhancement
- Title: text-2xl (24px) on mobile, text-3xl (30px) on desktop, bold
- Description: text-base (16px) on mobile, text-lg (18px) on desktop
- Button: White background, rounded-lg, with scale hover effect
- Icon container: 64px circle with white/20 background and backdrop blur
- Gradient direction: 135deg diagonal

**Requirements Validated:**
- 2.1: Displays below greeting on home screen
- 2.2: Includes title, description, and CTA button
- 2.3: Button click triggers navigation
- 2.4: Gradient background with rounded corners and padding
- 2.5: Supports subscription feature promotion with pricing/benefits

**Example:**
See `HeroBanner.example.tsx` for interactive examples with various gradient configurations and use cases.

---

### SectionHeader

The SectionHeader component provides consistent labeling for content sections with optional action buttons.

**Features:**
- Bold section title with consistent typography
- Optional action icon button for expandable sections
- Flex layout with space-between alignment
- Smooth hover transitions
- Accessible with proper ARIA attributes
- Consistent spacing and margins

**Props:**
```typescript
interface SectionHeaderProps {
  title: string;              // Section title text
  actionIcon?: React.ReactNode; // Optional icon for action button
  onActionClick?: () => void; // Optional click handler for action
}
```

**Usage:**
```tsx
import { SectionHeader } from './components/home/SectionHeader';
import { ChevronRight, Plus } from 'lucide-react';

// Basic section header without action
<SectionHeader title="Quiz Modes" />

// Section header with "View All" action
<SectionHeader
  title="Quick Links"
  actionIcon={<ChevronRight className="w-6 h-6" />}
  onActionClick={() => navigate('/quick-links')}
/>

// Section header with "Add New" action
<SectionHeader
  title="Upcoming Events"
  actionIcon={<Plus className="w-6 h-6" />}
  onActionClick={() => openAddEventModal()}
/>
```

**Design Specifications:**
- Title font: text-xl (20px), bold (700 weight)
- Margin bottom: 16px (mb-4)
- Layout: Flex with space-between alignment
- Action icon size: 24px (w-6 h-6)
- Transition: 200ms ease-out for hover effects
- Color: Primary text color from design tokens

**Requirements Validated:**
- 14.1: Includes section title
- 14.2: Displays action icon/button for sections with additional content
- 14.3: Action button click triggers handler
- 14.5: Maintains consistent typography and spacing

**Common Use Cases:**
- **Quiz Modes Section**: No action button, simple title
- **Quick Links Section**: ChevronRight icon for "View All"
- **Upcoming Events Section**: Plus icon for "Add Event" or ChevronRight for "View All"
- **Study Materials Section**: MoreHorizontal icon for additional options

**Example:**
See `SectionHeader.example.tsx` for interactive examples with various action icons and use cases.

## File Structure

```
src/components/home/
├── Header.tsx                 # Main Header component
├── Header.example.tsx         # Header usage examples
├── HeroBanner.tsx             # Main HeroBanner component
├── HeroBanner.example.tsx     # HeroBanner usage examples
├── SectionHeader.tsx          # Main SectionHeader component
├── SectionHeader.example.tsx  # SectionHeader usage examples
├── index.ts                   # Barrel exports
└── README.md                  # This file
```
