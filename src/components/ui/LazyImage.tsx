import React, { useState, useEffect, useRef } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
  showSkeleton?: boolean;
  skeletonClassName?: string;
}

/**
 * LazyImage Component
 * 
 * Implements lazy loading for images using Intersection Observer API.
 * Images are only loaded when they enter the viewport, improving initial page load performance.
 * 
 * Requirements: 13.2 - Lazy loading for below-the-fold images
 * 
 * @param src - Image source URL
 * @param alt - Alternative text for accessibility
 * @param fallback - Optional fallback image if src fails to load
 * @param threshold - Intersection observer threshold (0-1)
 * @param rootMargin - Margin around root for early loading
 * @param showSkeleton - Whether to show loading skeleton
 * @param skeletonClassName - Additional classes for skeleton
 */
export function LazyImage({
  src,
  alt,
  fallback,
  threshold = 0.01,
  rootMargin = '50px',
  showSkeleton = true,
  skeletonClassName = '',
  className = '',
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Check if browser supports Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            if (imgRef.current) {
              observer.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Loading Skeleton */}
      {isLoading && showSkeleton && (
        <div className="absolute inset-0">
          <LoadingSkeleton
            variant="rectangular"
            width="100%"
            height="100%"
            className={skeletonClassName}
          />
        </div>
      )}

      {/* Actual Image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={`
          ${className}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300
        `.trim()}
        {...props}
      />

      {/* Error State */}
      {hasError && !fallback && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm"
          role="img"
          aria-label={`Failed to load image: ${alt}`}
        >
          <span>Image unavailable</span>
        </div>
      )}
    </div>
  );
}

export default LazyImage;
