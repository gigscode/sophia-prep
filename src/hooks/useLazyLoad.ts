import { useState, useEffect, useRef } from 'react';

export interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * useLazyLoad Hook
 * 
 * Custom hook for lazy loading components using Intersection Observer.
 * Returns whether the element is visible in the viewport.
 * 
 * Requirements: 13.2, 13.3 - Lazy loading and prioritizing above-the-fold content
 * 
 * @param options - Configuration options for intersection observer
 * @returns [ref, isVisible] - Ref to attach to element and visibility state
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): [React.RefObject<T>, boolean] {
  const {
    threshold = 0.01,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    // If no element or already visible (and triggerOnce is true), don't observe
    if (!element || (isVisible && triggerOnce)) {
      return;
    }

    // Check if browser supports Intersection Observer
    if (!('IntersectionObserver' in window)) {
      // Fallback: make visible immediately
      setIsVisible(true);
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // If triggerOnce, disconnect after first intersection
            if (triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, isVisible]);

  return [elementRef, isVisible];
}

export default useLazyLoad;
