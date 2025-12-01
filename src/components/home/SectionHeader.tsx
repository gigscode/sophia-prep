import React from 'react';

export interface SectionHeaderProps {
  title: string;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
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
 */
export function SectionHeader({
  title,
  actionIcon,
  onActionClick,
}: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between mb-4"
      role="heading"
      aria-level={2}
    >
      {/* Section Title */}
      <h2
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
          className="
            flex
            items-center
            justify-center
            w-6
            h-6
            transition-colors
            duration-200
            ease-out
            hover:opacity-70
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
          "
          style={{
            color: 'hsl(var(--color-text-secondary))',
          }}
          aria-label="Section action"
        >
          {actionIcon}
        </button>
      )}
    </div>
  );
}

export default SectionHeader;
