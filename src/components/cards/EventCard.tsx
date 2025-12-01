import React from 'react';

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

  return (
    <div
      onClick={onClick}
      className={`
        ${isClickable ? 'card-hover card-touch-target cursor-pointer focus-visible-ring' : ''}
        card-container
        rounded-2xl
        shadow-sm
        transition-all
        duration-200
        ease-out
        p-4
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
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={`${type}: ${title} on ${formatDate(date)}`}
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
            className="text-sm leading-relaxed line-clamp-2"
            style={{
              color: 'hsl(var(--color-text-secondary))',
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default EventCard;
