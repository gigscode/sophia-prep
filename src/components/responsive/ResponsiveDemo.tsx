/**
 * Responsive Layout Demo Component
 * 
 * A demo component to visually test responsive layouts across different breakpoints.
 * This component can be used for manual testing and validation.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */


import { BookOpen } from 'lucide-react';
import { QuizModesSection } from '../home/QuizModesSection';
import { QuickLinksSection } from '../home/QuickLinksSection';
import { UpcomingEventsSection, EventData } from '../home/UpcomingEventsSection';

export function ResponsiveDemo() {
  // Sample events data for testing
  const sampleEvents: EventData[] = [
    {
      id: '1',
      title: 'JAMB 2025 Registration Opens',
      date: new Date('2025-01-15'),
      description: 'Registration for JAMB UTME 2025 begins',
      type: 'announcement',
    },
    {
      id: '2',
      title: 'WAEC Exam Period',
      date: new Date('2025-05-20'),
      description: 'WAEC examinations commence',
      type: 'exam',
    },
    {
      id: '3',
      title: 'Mock Exam Deadline',
      date: new Date('2025-03-01'),
      description: 'Last day to register for mock exams',
      type: 'deadline',
    },
    {
      id: '4',
      title: 'Results Release',
      date: new Date('2025-06-15'),
      description: 'JAMB results will be released',
      type: 'announcement',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Responsive Layout Demo
        </h1>
        <p className="text-gray-600">
          Test responsive behavior by resizing your browser window or using developer tools.
        </p>

        {/* Breakpoint indicators */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full block sm:hidden">
            Mobile (0-639px)
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full hidden sm:block md:hidden">
            Small (640-767px)
          </div>
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full hidden md:block lg:hidden">
            Medium (768-1023px)
          </div>
          <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full hidden lg:block xl:hidden">
            Large (1024-1279px)
          </div>
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full hidden xl:block">
            Extra Large (1280px+)
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Quiz Modes Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Quiz Modes Section
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Expected: 1 column on mobile, 2 columns on tablet and desktop
          </p>
          <QuizModesSection />
        </div>

        {/* Quick Links Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Quick Links Section
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Expected: 1 column on mobile, 2 columns on tablet, 4 columns on desktop
          </p>
          <QuickLinksSection />
        </div>

        {/* Upcoming Events Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Upcoming Events Section
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Expected: 1 column on mobile, 2 columns on tablet, 3 columns on desktop
          </p>
          <UpcomingEventsSection events={sampleEvents} />
        </div>

        {/* Touch Target Testing */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Touch Target Testing
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            All interactive elements should be at least 44px × 44px for accessibility
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Small touch targets for testing */}
            <button className="min-h-[44px] min-w-[44px] bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors">
              44px Min Button
            </button>

            <button className="min-h-[44px] min-w-[44px] bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors flex items-center justify-center">
              <BookOpen size={20} />
            </button>

            <button className="min-h-[44px] min-w-[44px] bg-purple-500 text-white rounded-lg px-6 py-3 hover:bg-purple-600 transition-colors">
              Larger Button
            </button>
          </div>
        </div>

        {/* Grid Layout Testing */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Grid Layout Testing
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Test different grid configurations
          </p>

          {/* 1-2-4 Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">1-2-4 Grid (Quick Links Pattern)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-blue-800 font-medium"
                >
                  Item {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* 1-2-3 Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">1-2-3 Grid (Events Pattern)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-green-800 font-medium"
                >
                  Event {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* 1-2 Grid */}
          <div>
            <h3 className="text-lg font-medium mb-2">1-2 Grid (Quiz Modes Pattern)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center text-purple-800 font-medium"
                >
                  Mode {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spacing and Sizing Test */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Spacing and Sizing Test
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Verify consistent spacing and sizing across components
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium">gap-4 (16px)</span>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium">p-6 (24px padding)</span>
            </div>
            <div className="p-8 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium">p-8 (32px padding)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResponsiveDemo;