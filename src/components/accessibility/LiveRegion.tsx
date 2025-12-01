import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * LiveRegion Component
 * 
 * Provides screen reader announcements using ARIA live regions.
 * Messages are announced to assistive technologies without disrupting
 * the user's current focus or interaction.
 * 
 * Requirements: Screen reader accessibility
 */
export function LiveRegion({ 
  message, 
  priority = 'polite', 
  clearAfter = 5000 
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {currentMessage}
    </div>
  );
}

/**
 * useAnnouncement Hook
 * 
 * Custom hook for making screen reader announcements.
 * Returns a function that can be called to announce messages.
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState<{
    message: string;
    priority: 'polite' | 'assertive';
    id: number;
  } | null>(null);

  const announce = React.useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setAnnouncement({
      message,
      priority,
      id: Date.now(), // Use timestamp as unique ID
    });
  }, []);

  const AnnouncementComponent = React.useMemo(() => {
    if (!announcement) return null;

    return (
      <LiveRegion
        key={announcement.id}
        message={announcement.message}
        priority={announcement.priority}
      />
    );
  }, [announcement]);

  return { announce, AnnouncementComponent };
}

export default LiveRegion;