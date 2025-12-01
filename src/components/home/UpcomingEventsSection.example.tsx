import React from 'react';
import { UpcomingEventsSection } from './UpcomingEventsSection';

/**
 * Example usage of UpcomingEventsSection component
 */
export function UpcomingEventsSectionExample() {
  // Sample event data
  const sampleEvents = [
    {
      id: '1',
      title: 'JAMB UTME 2025',
      date: new Date('2025-05-15'),
      description: 'Unified Tertiary Matriculation Examination',
      type: 'exam' as const,
    },
    {
      id: '2',
      title: 'WAEC Registration Deadline',
      date: new Date('2025-03-31'),
      description: 'Last day to register for WAEC examinations',
      type: 'deadline' as const,
    },
    {
      id: '3',
      title: 'New Study Materials Available',
      date: new Date('2025-02-10'),
      description: 'Updated past questions and video lessons',
      type: 'announcement' as const,
    },
    {
      id: '4',
      title: 'Mock Exam Week',
      date: new Date('2025-04-20'),
      description: 'Practice exams for all subjects',
      type: 'exam' as const,
    },
  ];

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
