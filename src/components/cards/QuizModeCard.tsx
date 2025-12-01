import React from 'react';
import { handleKeyboardActivation, generateAriaLabel } from '../../utils/accessibility';

export interface QuizModeCardProps {
  mode: 'practice' | 'cbt';
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

/**
 * QuizModeCard Component
 * 
 * A specialized card component for displaying quiz modes (Practice Mode and CBT Quiz).
 * Uses distinct color coding: orange for Practice Mode, green for CBT Quiz.
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6
 * 
 * @param mode - The quiz mode type: 'practice' or 'cbt'
 * @param icon - React node containing the icon to display
 * @param title - The title of the quiz mode
 * @param description - Descriptive text about the mode's behavior
 * @param onClick - Click handler for navigation to quiz interface
 * @param className - Additional CSS classes for customization
 */
export function QuizModeCard({
  mode,
  icon,
  title,
  description,
  onClick,
  className = '',
}: QuizModeCardProps) {
  const cardId = React.useId();
  const titleId = `${cardId}-title`;
  const descriptionId = `${cardId}-description`;

  // Color scheme based on mode
  const colorScheme = {
    practice: {
      backgroundColor: 'hsl(var(--color-bg-card))',
      iconBackgroundColor: 'hsl(var(--color-pastel-peach))', // Orange/peach for Practice Mode
      iconColor: 'hsl(var(--color-primary-orange))',
    },
    cbt: {
      backgroundColor: 'hsl(var(--color-bg-card))',
      iconBackgroundColor: 'hsl(var(--color-pastel-mint))', // Green/mint for CBT Quiz
      iconColor: 'hsl(var(--color-primary-green))',
    },
  };

  const colors = colorScheme[mode];
  const modeLabel = mode === 'practice' ? 'Practice Mode' : 'CBT Quiz Mode';

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => handleKeyboardActivation(e, onClick)}
      className={`
        cursor-pointer
        rounded-2xl
        shadow-sm
        transition-all
        duration-200
        ease-out
        hover:scale-[1.02]
        hover:shadow-lg
        p-6
        min-h-[44px]
        w-full
        focus-visible-ring
        interactive-element
        card-touch-target
        ${className}
      `.trim()}
      style={{
        backgroundColor: colors.backgroundColor,
      }}
      role="button"
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={generateAriaLabel(title, description, 'Quiz mode')}
    >
      {/* Icon Container - Circular with mode-specific background color */}
      <div
        className="
          w-14
          h-14
          rounded-full
          flex
          items-center
          justify-center
          mb-4
        "
        style={{
          backgroundColor: colors.iconBackgroundColor,
          color: colors.iconColor,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3
          id={titleId}
          className="text-xl font-semibold"
          style={{
            color: 'hsl(var(--color-text-primary))',
          }}
        >
          {title}
        </h3>

        <p
          id={descriptionId}
          className="text-sm leading-relaxed"
          style={{
            color: 'hsl(var(--color-text-secondary))',
          }}
        >
          {description}
        </p>
      </div>

      {/* Screen reader helper text */}
      <span className="sr-only">
        Click to start {modeLabel.toLowerCase()}. {description}
      </span>
    </article>
  );
}

export default QuizModeCard;
