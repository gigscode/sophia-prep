import React from 'react';

export interface LoadingSkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
}

/**
 * LoadingSkeleton Component
 * 
 * A placeholder component that displays a loading state with a shimmer animation.
 * Used to indicate that content is loading.
 * 
 * Requirements: 13.4
 */
export function LoadingSkeleton({
    className = '',
    variant = 'text',
    width,
    height,
}: LoadingSkeletonProps) {
    // Base classes for the skeleton
    const baseClasses = 'bg-gray-200 relative overflow-hidden';

    // Variant-specific classes
    const variantClasses = {
        text: 'h-4 w-full rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-md',
    };

    return (
        <div
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        shimmer
        ${className}
      `.trim()}
            style={{ width, height }}
            role="status"
            aria-label="Loading..."
        />
    );
}

export default LoadingSkeleton;
