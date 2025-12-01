import { LoadingSkeleton } from './LoadingSkeleton';

export interface CardSkeletonProps {
  variant?: 'feature' | 'quiz-mode' | 'quick-link' | 'event';
  className?: string;
}

/**
 * CardSkeleton Component
 * 
 * Provides loading skeleton placeholders for different card types.
 * Matches the dimensions and layout of actual cards for smooth loading experience.
 * 
 * Requirements: 13.4 - Loading skeletons for card components
 * 
 * @param variant - Type of card skeleton to display
 * @param className - Additional CSS classes
 */
export function CardSkeleton({ variant = 'feature', className = '' }: CardSkeletonProps) {
  // Feature Card Skeleton (default)
  if (variant === 'feature') {
    return (
      <div
        className={`
          rounded-2xl
          bg-white
          shadow-sm
          p-5
          space-y-3
          ${className}
        `.trim()}
        role="status"
        aria-label="Loading card..."
      >
        {/* Icon Circle */}
        <LoadingSkeleton variant="circular" width={48} height={48} />

        {/* Title */}
        <LoadingSkeleton variant="text" width="80%" height={20} />

        {/* Description */}
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width="100%" height={14} />
          <LoadingSkeleton variant="text" width="90%" height={14} />
        </div>
      </div>
    );
  }

  // Quiz Mode Card Skeleton
  if (variant === 'quiz-mode') {
    return (
      <div
        className={`
          rounded-2xl
          shadow-sm
          p-6
          space-y-4
          ${className}
        `.trim()}
        style={{ backgroundColor: 'hsl(var(--color-bg-card))' }}
        role="status"
        aria-label="Loading quiz mode card..."
      >
        {/* Icon Circle */}
        <LoadingSkeleton variant="circular" width={56} height={56} />

        {/* Title */}
        <LoadingSkeleton variant="text" width="70%" height={24} />

        {/* Description */}
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width="100%" height={14} />
          <LoadingSkeleton variant="text" width="85%" height={14} />
        </div>
      </div>
    );
  }

  // Quick Link Card Skeleton (Square)
  if (variant === 'quick-link') {
    return (
      <div
        className={`
          rounded-2xl
          shadow-sm
          p-6
          flex
          flex-col
          items-center
          justify-center
          space-y-3
          aspect-square
          ${className}
        `.trim()}
        style={{ backgroundColor: 'hsl(var(--color-bg-card))' }}
        role="status"
        aria-label="Loading quick link card..."
      >
        {/* Icon Circle */}
        <LoadingSkeleton variant="circular" width={48} height={48} />

        {/* Title */}
        <LoadingSkeleton variant="text" width="80%" height={18} />
      </div>
    );
  }

  // Event Card Skeleton (Horizontal)
  if (variant === 'event') {
    return (
      <div
        className={`
          rounded-2xl
          bg-white
          shadow-sm
          p-4
          flex
          gap-4
          ${className}
        `.trim()}
        role="status"
        aria-label="Loading event card..."
      >
        {/* Date Badge */}
        <div className="flex-shrink-0">
          <LoadingSkeleton variant="rounded" width={64} height={64} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" width="70%" height={18} />
          <LoadingSkeleton variant="text" width="100%" height={14} />
          <LoadingSkeleton variant="text" width="40%" height={12} />
        </div>
      </div>
    );
  }

  return null;
}

export default CardSkeleton;
