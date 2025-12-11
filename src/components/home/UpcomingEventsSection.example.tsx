import React from 'react';
import { UpcomingEventsSection } from './UpcomingEventsSection';

/**
 * Example usage of UpcomingEventsSection component
 */
export function UpcomingEventsSectionExample() {
  // TODO: Load event data from API/database
  const sampleEvents = [];

  const handleViewAll = () => {
    console.log('View All clicked');
  };

  return (
    <div className="p-8 space-y-8" style={{ backgroundColor: 'hsl(var(--color-bg-page))' }}>
      <h1 className="text-2xl font-bold">UpcomingEventsSection Examples</h1>

      {/* Example 1: With multiple events (shows View All) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">With Multiple Events (View All shown)</h2>
        <UpcomingEventsSection
          events={sampleEvents}
          onViewAllClick={handleViewAll}
        />
      </div>

      {/* Example 2: With 3 or fewer events (no View All) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">With 3 Events (No View All)</h2>
        <UpcomingEventsSection
          events={sampleEvents.slice(0, 3)}
          onViewAllClick={handleViewAll}
        />
      </div>

      {/* Example 3: With single event */}
      <div>
        <h2 className="text-lg font-semibold mb-4">With Single Event</h2>
        <UpcomingEventsSection
          events={sampleEvents.slice(0, 1)}
        />
      </div>

      {/* Example 4: Empty state (renders nothing) */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Empty State (No Events)</h2>
        <UpcomingEventsSection events={[]} />
        <p className="text-sm text-gray-500 mt-2">
          (Component renders nothing when no events are provided)
        </p>
      </div>
    </div>
  );
}

export default UpcomingEventsSectionExample;
