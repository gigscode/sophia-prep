import React from 'react';
import { handleKeyboardActivation, generateAriaLabel } from '../../utils/accessibility';

export interface EventCardProps {
  title: string;
  date: Date;
  description?: string;
  type: 'exam' | 'deadline' | 'announcement';
  onClick?: () => void;
  className?: string;
}

/**
 * EventCard Component
 * 
 * A horizontal card component for displaying upcoming events with date badges.
 * Shows event information with type-specific styling and formatting.
 * 
 * Requirements: 6.2, 6.3
 * 
 * @param title - The event title
 * @param date - The event date (Date object)
 * @param description - Optional description of the event
 * @param type - Event type: 'exam', 'deadline', or 'announcement'
 * @param onClick - Optional click handler for event details
 * @param className - Additional CSS classes for customization
 */
export function EventCard({
  title,
  date,
  description,
  type,
  onClick,
  className = '',
}: EventCardProps) {
  const cardId = React.useId();
  const titleId = `${cardId}-title`;
  const descriptionId = description ? `${cardId}-description` : undefined;
  const dateId = `${cardId}-date`;

  // Format date as "31 Dec, 2025"
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  // Get month abbreviation for date badge
  const getMonthAbbr = (date: Date): string => {
    return date.toLocaleString('en-US', { month: 'short' });
  };

  // Get day for date badge
  const getDay = (date: Date): string => {
    return date.getDate().toString();
  };

  // Color scheme based on event type
  const typeColors = {
    exam: {
      backgroundColor: 'hsl(var(--color-pastel-mint))',
      badgeColor: 'hsl(var(--color-primary-green))',
      indicatorColor: 'hsl(var(--color-primary-green))',
    },
    deadline: {
      backgroundColor: 'hsl(var(--color-pastel-peach))',
      badgeColor: 'hsl(var(--color-primary-orange))',
      indicatorColor: 'hsl(var(--color-primary-orange))',
    },
    announcement: {
      backgroundColor: 'hsl(var(--color-pastel-sky))',
      badgeColor: 'hsl(var(--color-primary-blue))',
      indicatorColor: 'hsl(var(--color-primary-blue))',
    },
  };

  const colors = typeColors[type];
  const isClickable = !!onClick;
  const formattedDate = formatDate(date);

  const Component = isClickable ? 'article' : 'div';

  return (
    <Component
      onClick={onClick}
      onKeyDown={isClickable ? (e) => handleKeyboardActivation(e, onClick!) : undefined}
      className={`
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg focus-visible-ring interactive-element card-touch-target' : ''}
        rounded-2xl
        shadow-sm
        transition-all
        duration-200
        ease-out
        p-4
        w-full
        flex
        items-center
        gap-4
        ${className}
      `.trim()}
      style={{
        backgroundColor: 'hsl(var(--color-bg-card))',
      }}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-labelledby={titleId}
      aria-describedby={[dateId, descriptionId].filter(Boolean).join(' ')}
      aria-label={generateAriaLabel(title, description, type)}
    >
      {/* Date Badge - Square with day and month */}
      <div
        className="
          flex-shrink-0
          w-16
          h-16
          rounded-xl
          flex
          flex-col
          items-center
          justify-center
        "
        style={{
          backgroundColor: colors.backgroundColor,
        }}
        aria-hidden="true"
      >
        <div
          className="text-2xl font-bold leading-none"
          style={{
            color: colors.badgeColor,
          }}
        >
          {getDay(date)}
        </div>
        <div
          className="text-xs font-medium uppercase mt-1"
          style={{
            color: colors.badgeColor,
          }}
        >
          {getMonthAbbr(date)}
        </div>
      </div>

      {/* Event Information */}
      <div className="flex-1 min-w-0">
        {/* Event Type Indicator */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: colors.indicatorColor,
            }}
            aria-hidden="true"
          />
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{
              color: colors.indicatorColor,
            }}
          >
            {type}
          </span>
        </div>

        {/* Event Title */}
        <h3
          id={titleId}
          className="text-base font-semibold leading-tight mb-1 truncate"
          style={{
            color: 'hsl(var(--color-text-primary))',
          }}
        >
          {title}
        </h3>

        {/* Event Description (if provided) */}
        {description && (
          <p
            id={descriptionId}
            className="text-sm leading-relaxed line-clamp-2"
            style={{
              color: 'hsl(var(--color-text-secondary))',
            }}
          >
            {description}
          </p>
        )}

        {/* Hidden date for screen readers */}
        <span id={dateId} className="sr-only">
          Event date: {formattedDate}
        </span>
      </div>

      {/* Screen reader helper text */}
      {isClickable && (
        <span className="sr-only">
          Click to view details for {title} on {formattedDate}
        </span>
      )}
    </Component>
  );
}

export default EventCard;
