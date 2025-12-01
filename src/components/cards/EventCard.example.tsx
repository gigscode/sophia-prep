import React from 'react';
import { EventCard } from './EventCard';

/**
 * EventCard Component Examples
 * 
 * This file demonstrates various use cases of the EventCard component.
 */

export function EventCardExamples() {
  const handleEventClick = (eventTitle: string) => {
    console.log(`Clicked event: ${eventTitle}`);
  };

  return (
    <div className="p-8 space-y-6" style={{ backgroundColor: 'hsl(var(--color-bg-page))' }}>
      <h1 className="text-2xl font-bold mb-4">EventCard Examples</h1>

      {/* Exam Event */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Exam Event</h2>
        <EventCard
          title="JAMB UTME 2025"
          date={new Date('2025-05-15')}
          description="Joint Admissions and Matriculation Board Unified Tertiary Matriculation Examination"
          type="exam"
          onClick={() => handleEventClick('JAMB UTME 2025')}
        />
      </div>

      {/* Deadline Event */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Deadline Event</h2>
        <EventCard
          title="WAEC Registration Deadline"
          date={new Date('2025-03-31')}
          description="Last day to register for West African Examinations Council exams"
          type="deadline"
          onClick={() => handleEventClick('WAEC Registration Deadline')}
        />
      </div>

      {/* Announcement Event */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Announcement Event</h2>
        <EventCard
          title="New Study Materials Available"
          date={new Date('2025-02-01')}
          description="Updated past questions and video lessons for all subjects"
          type="announcement"
          onClick={() => handleEventClick('New Study Materials')}
        />
      </div>

      {/* Event without description */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Event without Description</h2>
        <EventCard
          title="Mock Exam Day"
          date={new Date('2025-04-20')}
          type="exam"
          onClick={() => handleEventClick('Mock Exam Day')}
        />
      </div>

      {/* Event without click handler (non-interactive) */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Non-Interactive Event</h2>
        <EventCard
          title="School Holiday"
          date={new Date('2025-12-25')}
          description="Christmas holiday - no classes"
          type="announcement"
        />
      </div>

      {/* Multiple events in a grid */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Multiple Events Grid</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EventCard
            title="JAMB Mock Exam"
            date={new Date('2025-04-10')}
            type="exam"
            onClick={() => handleEventClick('JAMB Mock')}
          />
          <EventCard
            title="Registration Opens"
            date={new Date('2025-02-15')}
            type="announcement"
            onClick={() => handleEventClick('Registration Opens')}
          />
          <EventCard
            title="Payment Deadline"
            date={new Date('2025-03-01')}
            type="deadline"
            onClick={() => handleEventClick('Payment Deadline')}
          />
          <EventCard
            title="Results Release"
            date={new Date('2025-06-30')}
            type="announcement"
            onClick={() => handleEventClick('Results Release')}
          />
        </div>
      </div>
    </div>
  );
}

export default EventCardExamples;
