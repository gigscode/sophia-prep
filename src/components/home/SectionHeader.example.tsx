import React from 'react';
import { SectionHeader } from './SectionHeader';
import { ChevronRight, Plus, MoreHorizontal } from 'lucide-react';

/**
 * Example usage of the SectionHeader component
 * 
 * This file demonstrates various use cases for the SectionHeader component
 * including sections with and without action buttons.
 */

export function SectionHeaderExamples() {
  return (
    <div className="space-y-8 p-6 bg-gray-50">
      {/* Example 1: Basic section header without action */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Basic Section Header (No Action)
        </h3>
        <SectionHeader title="Quiz Modes" />
        <div className="mt-2 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Section content goes here...</p>
        </div>
      </div>

      {/* Example 2: Section header with chevron action (expand/view all) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Section Header with Chevron (View All)
        </h3>
        <SectionHeader
          title="Quick Links"
          actionIcon={<ChevronRight className="w-6 h-6" />}
          onActionClick={() => console.log('View all quick links')}
        />
        <div className="mt-2 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Section content goes here...</p>
        </div>
      </div>

      {/* Example 3: Section header with plus action (add new) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Section Header with Plus (Add New)
        </h3>
        <SectionHeader
          title="Upcoming Events"
          actionIcon={<Plus className="w-6 h-6" />}
          onActionClick={() => console.log('Add new event')}
        />
        <div className="mt-2 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Section content goes here...</p>
        </div>
      </div>

      {/* Example 4: Section header with more options action */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Section Header with More Options
        </h3>
        <SectionHeader
          title="Study Materials"
          actionIcon={<MoreHorizontal className="w-6 h-6" />}
          onActionClick={() => console.log('Show more options')}
        />
        <div className="mt-2 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Section content goes here...</p>
        </div>
      </div>

      {/* Example 5: Long title */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4">
          Section Header with Long Title
        </h3>
        <SectionHeader
          title="Recommended Study Resources for JAMB Preparation"
          actionIcon={<ChevronRight className="w-6 h-6" />}
          onActionClick={() => console.log('View all resources')}
        />
        <div className="mt-2 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600">Section content goes here...</p>
        </div>
      </div>
    </div>
  );
}

export default SectionHeaderExamples;
