import React from 'react';
import { BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';
import { QuizModeCard } from '../cards/QuizModeCard';
import { ChevronRight } from 'lucide-react';

export interface QuizModesSectionProps {
  onExpandClick?: () => void;
  className?: string;
}

/**
 * QuizModesSection Component
 * 
 * Displays the Quiz Modes section with Practice Mode and CBT Quiz cards.
 * Includes a section header with optional expand action.
 * Uses responsive grid layout: 1 column on mobile, 2 columns on tablet/desktop.
 * 
 * Requirements: 3.1, 3.2
 * 
 * @param onExpandClick - Optional handler for section expand action
 * @param className - Additional CSS classes for customization
 */
export function QuizModesSection({
  onExpandClick,
  className = '',
}: QuizModesSectionProps) {
  const navigate = useNavigate();

  const handlePracticeModeClick = () => {
    navigate('/practice');
  };

  const handleCBTQuizClick = () => {
    navigate('/mock-exams');
  };

  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {/* Section Header */}
      <SectionHeader
        title="Quiz Modes"
        actionIcon={onExpandClick ? <ChevronRight size={24} /> : undefined}
        onActionClick={onExpandClick}
      />

      {/* Quiz Mode Cards Grid - Responsive */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
        "
      >
        {/* Practice Mode Card */}
        <QuizModeCard
          mode="practice"
          icon={<BookOpen size={28} />}
          title="Practice Mode"
          description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually with a submit button."
          onClick={handlePracticeModeClick}
        />

        {/* CBT Quiz Card */}
        <QuizModeCard
          mode="cbt"
          icon={<Clock size={28} />}
          title="CBT Quiz (Past Questions)"
          description="Timed quiz simulating real JAMB/WAEC exam conditions with automatic submission. No explanations shown until after completion."
          onClick={handleCBTQuizClick}
        />
      </div>
    </section>
  );
}

export default QuizModesSection;
