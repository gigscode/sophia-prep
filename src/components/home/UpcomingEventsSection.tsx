import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';
import { EventCard } from '../cards/EventCard';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

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
 * @param isLoading - Whether the section is in loading state
 */
export function UpcomingEventsSection({
  events = [],
  onViewAllClick,
  className = '',
  isLoading = false,
}: UpcomingEventsSectionProps & { isLoading?: boolean }) {
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

  // Don't render section if no events (unless loading)
  if (events.length === 0 && !isLoading) {
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
        {showViewAll && !isLoading && (
          <button
            onClick={handleViewAllClick}
            className="
              touch-target-interactive
              flex
              items-center
              gap-1
              text-sm
              font-medium
              text-blue-600
              transition-colors
              duration-200
              ease-out
              hover:opacity-70
              focus-visible-ring
            "
            style={{
              color: undefined,
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
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[100px] w-full rounded-2xl overflow-hidden">
              <LoadingSkeleton variant="rectangular" height="100%" width="100%" />
            </div>
          ))
          : events.map((event, index) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              description={event.description}
              type={event.type}
              onClick={() => handleEventClick(event.id)}
              className={`animate-fade-in-up animate-delay-${index * 50}`}
            />
          ))}
      </div>
    </section>
  );
}

export default UpcomingEventsSection;
