import { BrowserRouter } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';

/**
 * BottomNavigation Component Examples
 * 
 * This file demonstrates various usage scenarios for the BottomNavigation component.
 */

// Example 1: Basic Usage
export function BasicExample() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Page Content</h1>
          <p className="text-gray-600">
            The bottom navigation is fixed at the bottom of the screen.
            Scroll down to see it remain in place.
          </p>
          
          {/* Filler content to demonstrate scrolling */}
          <div className="space-y-4 mt-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Content Block {i + 1}</h3>
                <p className="text-sm text-gray-600">
                  This is sample content to demonstrate scrolling behavior.
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}

// Example 2: With Different Routes
export function RouteExample() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Navigation Example</h1>
          <p className="text-gray-600 mb-4">
            Click on different navigation items to see the active state change.
          </p>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Current Page</h2>
            <p className="text-gray-600">
              The active navigation item is highlighted with a blue color and
              a small indicator dot above the icon.
            </p>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}

// Example 3: Mobile View Simulation
export function MobileExample() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-16 border-x border-gray-300">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-2">Mobile View</h1>
          <p className="text-sm text-gray-600 mb-4">
            This example simulates a mobile device viewport.
          </p>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-sm">Feature 1</h3>
              <p className="text-xs text-gray-600">Mobile-optimized content</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-sm">Feature 2</h3>
              <p className="text-xs text-gray-600">Touch-friendly interface</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-sm">Feature 3</h3>
              <p className="text-xs text-gray-600">Responsive design</p>
            </div>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}

// Example 4: With Page Content and Safe Area
export function SafeAreaExample() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Safe Area Example</h1>
          <p className="text-gray-600 mb-4">
            On devices with notches or home indicators (like iPhone X and newer),
            the bottom navigation includes safe area insets to ensure content
            is not obscured.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Note</h3>
            <p className="text-sm text-blue-800">
              The page content has bottom padding that accounts for both the
              navigation height (64px) and the safe area inset.
            </p>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}

// Example 5: Integration with Layout
export function LayoutIntegrationExample() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold">Sophia Prep</h1>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 pb-20">
          <h2 className="text-2xl font-bold mb-4">Welcome</h2>
          <p className="text-gray-600 mb-4">
            This example shows how the BottomNavigation integrates with a
            typical page layout including header and main content.
          </p>
          
          <div className="grid gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Quick Access</h3>
              <p className="text-sm text-gray-600">
                Use the bottom navigation to quickly switch between sections.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Always Visible</h3>
              <p className="text-sm text-gray-600">
                The navigation stays fixed at the bottom as you scroll.
              </p>
            </div>
          </div>
        </main>
        
        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </BrowserRouter>
  );
}

// Default export for Storybook or documentation tools
export default {
  title: 'Layout/BottomNavigation',
  component: BottomNavigation,
  examples: {
    BasicExample,
    RouteExample,
    MobileExample,
    SafeAreaExample,
    LayoutIntegrationExample,
  },
};
