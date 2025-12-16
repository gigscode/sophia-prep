
import { BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from './SectionHeader';
import { QuizModeCard } from '../cards/QuizModeCard';
import { CardSkeleton } from '../ui/CardSkeleton';

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
 * @param isLoading - Whether the section is in loading state
 */
export function QuizModesSection({
  onExpandClick,
  className = '',
  isLoading = false,
}: QuizModesSectionProps & { isLoading?: boolean }) {
  const navigate = useNavigate();

  const handlePracticeModeClick = () => {
    navigate('/practice');
  };

  const handleCBTQuizClick = () => {
    navigate('/jamb-exam');
  };

  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {/* Section Header */}
      <SectionHeader
        title="CBT Exam Modes"
        actionIcon={onExpandClick ? <ChevronRight size={24} /> : undefined}
        onActionClick={onExpandClick}
      />

      {/* Quiz Mode Cards Grid - Responsive: 1 column mobile, 2 columns tablet+ */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
          w-full
        "
      >
        {isLoading ? (
          <>
            <CardSkeleton
              variant="quiz-mode"
              className="animate-fade-in-up animate-delay-0"
            />
            <CardSkeleton
              variant="quiz-mode"
              className="animate-fade-in-up animate-delay-100"
            />
          </>
        ) : (
          <>
            {/* Practice Mode Card */}
            <QuizModeCard
              mode="practice"
              icon={<BookOpen size={28} />}
              title="Practice Mode"
              description="Familiarize yourself with exam questions. See explanations after each answer and time yourself manually with a submit button."
              onClick={handlePracticeModeClick}
              className="animate-fade-in-up animate-delay-0"
            />

            {/* CBT Quiz Card */}
            <QuizModeCard
              mode="cbt"
              layout="horizontal"
              icon={
                <img 
                  src="/jamb_logo.png" 
                  alt="JAMB Logo" 
                  className="w-9 h-9 object-contain"
                />
              }
              title="CBT Quiz"
              description="Timed past questions quiz. 2hr 30min for JAMB. Auto-submits when time expires. No explanations until completion."
              onClick={handleCBTQuizClick}
              className="animate-fade-in-up animate-delay-100"
            />
          </>
        )}
      </div>
    </section>
  );
}

export default QuizModesSection;
