import React from 'react';

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

  return (
    <div
      onClick={onClick}
      className={`
        card-hover
        cursor-pointer
        rounded-2xl
        shadow-sm
        transition-all
        duration-200
        ease-out
        p-6
        ${className}
      `.trim()}
      style={{
        backgroundColor: colors.backgroundColor,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${title}: ${description}`}
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
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3
          className="text-xl font-semibold"
          style={{
            color: 'hsl(var(--color-text-primary))',
          }}
        >
          {title}
        </h3>

        <p
          className="text-sm leading-relaxed"
          style={{
            color: 'hsl(var(--color-text-secondary))',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export default QuizModeCard;
