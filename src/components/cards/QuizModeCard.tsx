import React from 'react';
import { handleKeyboardActivation, generateAriaLabel } from '../../utils/accessibility';

export interface QuizModeCardProps {
  mode: 'practice' | 'cbt';
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  layout?: 'vertical' | 'horizontal';
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
  layout = 'vertical',
}: QuizModeCardProps) {
  const cardId = React.useId();
  const titleId = `${cardId}-title`;
  const descriptionId = `${cardId}-description`;

  // Color scheme based on mode with transparent backgrounds and faded icons
  const colorScheme = {
    practice: {
      backgroundColor: 'rgba(251, 146, 60, 0.1)', // Transparent orange background
      iconBackgroundColor: 'rgba(251, 146, 60, 0.15)', // Slightly more opaque orange for icon container
      iconColor: 'rgba(251, 146, 60, 0.6)', // Faded/transparent orange icon
      iconOpacity: '0.6',
    },
    cbt: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)', // Transparent green background
      iconBackgroundColor: 'rgba(34, 197, 94, 0.15)', // Slightly more opaque green for icon container
      iconColor: 'rgba(34, 197, 94, 0.6)', // Faded/transparent green icon
      iconOpacity: '0.6',
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
      {layout === 'horizontal' ? (
        /* Horizontal Layout - 30/70 split with logo on left */
        <div className="flex items-center gap-6">
          {/* Left side - 30% - Logo */}
          <div className="flex-[0_0_30%] flex items-center justify-center">
            <div
              className="
                w-20
                h-20
                flex
                items-center
                justify-center
              "
              style={{
                opacity: colors.iconOpacity,
              }}
              aria-hidden="true"
            >
              {icon}
            </div>
          </div>

          {/* Right side - 70% - Content */}
          <div className="flex-[0_0_70%] space-y-3">
            {/* Title */}
            <h3
              id={titleId}
              className="text-2xl font-semibold"
              style={{
                color: 'hsl(var(--color-text-primary))',
              }}
            >
              {title}
            </h3>

            {/* Description */}
            <p
              id={descriptionId}
              className="text-base leading-relaxed"
              style={{
                color: 'hsl(var(--color-text-secondary))',
              }}
            >
              {description}
            </p>
          </div>
        </div>
      ) : (
        /* Vertical Layout - Icon above title */
        <>
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
              opacity: colors.iconOpacity,
            }}
            aria-hidden="true"
          >
            {icon}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3
              id={titleId}
              className="text-2xl font-semibold"
              style={{
                color: 'hsl(var(--color-text-primary))',
              }}
            >
              {title}
            </h3>

            <p
              id={descriptionId}
              className="text-lg leading-relaxed"
              style={{
                color: 'hsl(var(--color-text-secondary))',
              }}
            >
              {description}
            </p>
          </div>
        </>
      )}

      {/* Screen reader helper text */}
      <span className="sr-only">
        Click to start {modeLabel.toLowerCase()}. {description}
      </span>
    </article>
  );
}

export default QuizModeCard;
