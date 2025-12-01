import React from 'react';
import { QuizModesSection } from './QuizModesSection';
import { BrowserRouter } from 'react-router-dom';

/**
 * Example usage of QuizModesSection component
 */
export function QuizModesSectionExample() {
  const handleExpand = () => {
    console.log('Expand Quiz Modes section');
  };

  return (
    <BrowserRouter>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">QuizModesSection Examples</h1>

          {/* Example 1: With expand action */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">With Expand Action</h2>
            <QuizModesSection onExpandClick={handleExpand} />
          </div>

          {/* Example 2: Without expand action */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Without Expand Action</h2>
            <QuizModesSection />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default QuizModesSectionExample;
