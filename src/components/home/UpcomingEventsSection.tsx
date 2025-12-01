import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';
import { EventCard } from '../cards/EventCard';

export interface EventData {
  id: string;
  title: string;
  date: Date;
  description?: string;
  type: 'exam' | 'deadline' | 'announcement';
}

export interface UpcomingEventsSectionProps {
  events?: EventData[];
  onViewAllClick?: () => void;
  className?: string;
}

/**
 * UpcomingEventsSection Component
 * 
 * Displays upcoming events with EventCards in a responsive grid layout.
 * Shows "View All" link when more than 3 events exist.
 * Uses responsive layout: 1 column on mobile, 2-3 columns on desktop.
 * 
 * Requirements: 6.1, 6.4, 6.5
 * 
 * @param events - Array of event data to display
 * @param onViewAllClick - Optional handler for "View All" action
 * @param className - Additional CSS classes for customization
 */
export function UpcomingEventsSection({
  events = [],
  onViewAllClick,
  className = '',
}: UpcomingEventsSectionProps) {
  const navigate = useNavigate();

  // Show "View All" link when more than 3 events exist (Requirement 6.4)
  const showViewAll = events.length > 3;

  // Handle View All click - navigate or use custom handler
  const handleViewAllClick = () => {
    if (onViewAllClick) {
      onViewAllClick();
    } else {
      // Default navigation to events page
      navigate('/events');
    }
  };

  // Handle individual event card click
  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  // Don't render section if no events
  if (events.length === 0) {
    return null;
  }

  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {/* Section Header with View All link */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Upcoming Events"
          actionIcon={undefined}
          onActionClick={undefined}
        />
        
        {/* View All Link - shown when more than 3 events (Requirement 6.4) */}
        {showViewAll && (
          <button
            onClick={handleViewAllClick}
            className="
              flex
              items-center
              gap-1
              text-sm
              font-medium
              transition-colors
              duration-200
              ease-out
              hover:opacity-70
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
            "
            style={{
              color: 'hsl(var(--color-primary-blue))',
            }}
            aria-label="View all events"
          >
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Event Cards Grid - Responsive (Requirement 6.1) */}
      {/* 1 column mobile, 2-3 columns desktop */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-4
        "
      >
        {events.map((event) => (
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

export default UpcomingEventsSection;
