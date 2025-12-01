import React from 'react';
import { handleKeyboardActivation, generateAriaLabel } from '../../utils/accessibility';

export interface FeatureCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconBackgroundColor: string;
  backgroundColor?: string;
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * FeatureCard Component
 * 
 * A reusable card component for displaying features, quiz modes, and quick links.
 * Implements the modern UI redesign specifications with hover effects and consistent styling.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.5
 * 
 * @param title - The main title text displayed on the card
 * @param description - Optional description text below the title
 * @param icon - React node containing the icon to display
 * @param iconBackgroundColor - Background color for the circular icon container (HSL format)
 * @param backgroundColor - Optional background color for the card (defaults to white)
 * @param onClick - Click handler function for card interaction
 * @param size - Card size variant: 'small', 'medium', or 'large'
 * @param className - Additional CSS classes for customization
 */
export function FeatureCard({
  title,
  description,
  icon,
  iconBackgroundColor,
  backgroundColor = 'hsl(var(--color-bg-card))',
  onClick,
  size = 'medium',
  className = '',
}: FeatureCardProps) {
  const cardId = React.useId();
  const titleId = `${cardId}-title`;
  const descriptionId = description ? `${cardId}-description` : undefined;

  // Size-based styling
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-5',
    large: 'p-6',
  };

  const iconSizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-14 h-14',
  };

  const titleSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  };

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
        min-h-[44px]
        min-w-[44px]
        w-full
        focus-visible-ring
        interactive-element
        card-touch-target
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      style={{
        backgroundColor,
      }}
      role="button"
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={generateAriaLabel(title, description, 'Feature card')}
    >
      {/* Icon Container - Circular with background color */}
      <div
        className={`
          ${iconSizeClasses[size]}
          rounded-full
          flex
          items-center
          justify-center
          mb-3
        `.trim()}
        style={{
          backgroundColor: iconBackgroundColor,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3
          id={titleId}
          className={`
            ${titleSizeClasses[size]}
            font-semibold
            text-gray-900
          `.trim()}
          style={{
            color: 'hsl(var(--color-text-primary))',
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            id={descriptionId}
            className="text-sm leading-relaxed"
            style={{
              color: 'hsl(var(--color-text-secondary))',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Screen reader helper text */}
      <span className="sr-only">
        Click to access {title.toLowerCase()}
        {description && `. ${description}`}
      </span>
    </article>
  );
}

export default FeatureCard;
