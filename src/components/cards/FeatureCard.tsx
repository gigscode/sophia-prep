import React from 'react';

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
        ${sizeClasses[size]}
        ${className}
      `.trim()}
      style={{
        backgroundColor,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={title}
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
      >
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3
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
            className="text-sm leading-relaxed"
            style={{
              color: 'hsl(var(--color-text-secondary))',
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default FeatureCard;
