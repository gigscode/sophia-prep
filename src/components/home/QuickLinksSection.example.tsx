import React from 'react';
import { QuickLinksSection } from './QuickLinksSection';

/**
 * Example usage of QuickLinksSection component
 */
export function QuickLinksSectionExample() {
  const handleExpandClick = () => {
    console.log('Expand Quick Links section');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">QuickLinksSection Examples</h1>

        {/* Example 1: With expand action */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-4">With Expand Action</h2>
          <QuickLinksSection onExpandClick={handleExpandClick} />
        </div>

        {/* Example 2: Without expand action */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Without Expand Action</h2>
          <QuickLinksSection />
        </div>

        {/* Example 3: With custom className */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-4">With Custom Styling</h2>
          <QuickLinksSection className="bg-white p-6 rounded-lg shadow-md" />
        </div>
      </div>
    </div>
  );
}

export default QuickLinksSectionExample;
