import React from 'react';

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
  aspectRatio = '1:1',
  className = '',
}: QuickLinkCardProps) {
  // Aspect ratio classes
  const aspectRatioClass = aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/3]';

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
        flex
        flex-col
        items-center
        justify-center
        text-center
        ${aspectRatioClass}
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
      {/* Icon - Centered with optional color */}
      <div
        className="
          w-10
          h-10
          flex
          items-center
          justify-center
          mb-3
        "
        style={{
          color: iconColor || 'hsl(var(--color-text-primary))',
        }}
      >
        {icon}
      </div>

      {/* Title - Centered below icon */}
      <h3
        className="
          text-base
          font-semibold
          leading-tight
        "
        style={{
          color: 'hsl(var(--color-text-primary))',
        }}
      >
        {title}
      </h3>
    </div>
  );
}

export default QuickLinkCard;
