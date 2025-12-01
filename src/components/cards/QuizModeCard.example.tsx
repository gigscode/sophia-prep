/**
 * QuizModeCard Usage Examples
 * 
 * This file demonstrates how to use the QuizModeCard component
 * for Practice Mode and CBT Quiz according to the modern UI redesign specifications.
 */

import React from 'react';
import { QuizModeCard } from './QuizModeCard';

// Example icons (in real usage, these would come from lucide-react)
const BookOpenIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const ClipboardCheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

export function QuizModeCardExamples() {
  const handlePracticeModeClick = () => {
    console.log('Navigate to Practice Mode');
    // In real app: navigate('/practice-mode')
  };

  const handleCBTQuizClick = () => {
    console.log('Navigate to CBT Quiz');
    // In real app: navigate('/cbt-quiz')
  };

  return (
    <div className="p-8 space-y-8" style={{ backgroundColor: 'hsl(var(--color-bg-page))' }}>
      <h1 className="text-3xl font-bold mb-6">QuizModeCard Examples</h1>

      {/* Practice Mode Card - Orange Theme */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Practice Mode Card</h2>
        <div className="max-w-md">
          <QuizModeCard
            mode="practice"
            icon={<BookOpenIcon />}
            title="Practice Mode"
            description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually with a submit button."
            onClick={handlePracticeModeClick}
          />
        </div>
      </div>

      {/* CBT Quiz Card - Green Theme */}
      <div>
        <h2 className="text-xl font-semibold mb-4">CBT Quiz Card (Past Questions)</h2>
        <div className="max-w-md">
          <QuizModeCard
            mode="cbt"
            icon={<ClipboardCheckIcon />}
            title="CBT Quiz (Past Questions)"
            description="Timed quiz simulating real JAMB/WAEC exam conditions with automatic submission after time elapses (2hr 30min for JAMB). No explanations shown until after completion."
            onClick={handleCBTQuizClick}
          />
        </div>
      </div>

      {/* Side-by-Side Grid Layout */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quiz Modes Section (Grid Layout)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <QuizModeCard
            mode="practice"
            icon={<BookOpenIcon />}
            title="Practice Mode"
            description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually."
            onClick={handlePracticeModeClick}
          />
          <QuizModeCard
            mode="cbt"
            icon={<ClipboardCheckIcon />}
            title="CBT Quiz (Past Questions)"
            description="Timed quiz simulating real JAMB/WAEC exam conditions. Automatic submission after time elapses."
            onClick={handleCBTQuizClick}
          />
        </div>
      </div>

      {/* Stacked Layout (Mobile) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Stacked Layout (Mobile View)</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <QuizModeCard
            mode="practice"
            icon={<BookOpenIcon />}
            title="Practice Mode"
            description="Learn at your own pace with immediate feedback."
            onClick={handlePracticeModeClick}
          />
          <QuizModeCard
            mode="cbt"
            icon={<ClipboardCheckIcon />}
            title="CBT Quiz"
            description="Timed exam simulation with JAMB/WAEC past questions."
            onClick={handleCBTQuizClick}
          />
        </div>
      </div>
    </div>
  );
}

export default QuizModeCardExamples;
