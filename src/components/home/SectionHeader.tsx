import React from 'react';
import { handleKeyboardActivation } from '../../utils/accessibility';

export interface SectionHeaderProps {
  title: string;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
  actionLabel?: string;
}

/**
 * SectionHeader Component
 * 
 * A header component for sections with a title and optional action button.
 * Used to label content sections throughout the home screen.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.5
 * 
 * @param title - The section title text
 * @param actionIcon - Optional icon element for the action button
 * @param onActionClick - Optional click handler for the action button
 * @param actionLabel - Optional accessible label for the action button
 */
export function SectionHeader({
  title,
  actionIcon,
  onActionClick,
  actionLabel = 'View more',
}: SectionHeaderProps) {
  const headingId = React.useId();
  
  return (
    <div
      className="flex items-center justify-between mb-4"
      role="region"
      aria-labelledby={headingId}
    >
      {/* Section Title */}
      <h2
        id={headingId}
        className="text-xl font-bold"
        style={{
          color: 'hsl(var(--color-text-primary))',
        }}
      >
        {title}
      </h2>

      {/* Optional Action Button */}
      {actionIcon && onActionClick && (
        <button
          onClick={onActionClick}
          onKeyDown={(e) => handleKeyboardActivation(e, onActionClick)}
          className="
            icon-button-touch-target
            flex
            items-center
            justify-center
            transition-colors
            duration-200
            ease-out
            hover:opacity-70
            focus-visible-ring
            interactive-element
          "
          style={{
            color: 'hsl(var(--color-text-secondary))',
          }}
          aria-label={`${actionLabel} for ${title}`}
          type="button"
        >
          {actionIcon}
          <span className="sr-only">
            {actionLabel} for {title}
          </span>
        </button>
      )}
    </div>
  );
}

export default SectionHeader;
