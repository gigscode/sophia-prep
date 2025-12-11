import React from 'react';
import { handleKeyboardActivation, generateAriaLabel } from '../../utils/accessibility';

export interface QuickLinkCardProps {
  title: string;
  icon: React.ReactNode;
  backgroundColor: string;
  iconColor?: string;
  onClick: () => void;
  aspectRatio?: '1:1' | '4:3';
  className?: string;
}

/**
 * QuickLinkCard Component
 * 
 * A square/rectangular card component for quick access to frequently used features.
 * Uses pastel background colors and centered layout with icon and title.
 * 
 * Requirements: 4.3, 4.4
 * 
 * @param title - The title text displayed below the icon
 * @param icon - React node containing the icon to display
 * @param backgroundColor - Pastel background color (HSL format)
 * @param iconColor - Optional color for the icon (defaults to primary text color)
 * @param onClick - Click handler for navigation to feature page
 * @param aspectRatio - Card aspect ratio: '1:1' (square) or '4:3' (rectangular)
 * @param className - Additional CSS classes for customization
 */
export function QuickLinkCard({
  title,
  icon,
  backgroundColor,
  iconColor,
  onClick,

  className = '',
}: QuickLinkCardProps) {
  const cardId = React.useId();
  const titleId = `${cardId}-title`;




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
        p-3
        min-h-[44px]
        min-w-[44px]
        w-full
        flex
        flex-col
        items-center
        justify-center
        text-center
        focus-visible-ring
        interactive-element
        card-touch-target
        aspect-[3/2]
        ${className}
      `.trim()}
      style={{
        backgroundColor,
      }}
      role="button"
      tabIndex={0}
      aria-labelledby={titleId}
      aria-label={generateAriaLabel(title, undefined, 'Quick link')}
    >
      {/* Icon - Centered with optional color */}
      <div
        className="
          w-25
          h-25
          flex
          items-center
          justify-center
          mb-1.5
        "
        style={{
          color: iconColor || 'hsl(var(--color-text-primary))',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title - Centered below icon */}
      <h3
        id={titleId}
        className="
          text-xl
          font-semibold
          leading-tight
        "
        style={{
          color: 'hsl(var(--color-text-primary))',
        }}
      >
        {title}
      </h3>

      {/* Screen reader helper text */}
      <span className="sr-only">
        Click to access {title.toLowerCase()}
      </span>
    </article>
  );
}

export default QuickLinkCard;
