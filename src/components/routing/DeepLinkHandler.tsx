/**
 * Deep Link Handler Component
 * 
 * Provides UI components for bookmark and share functionality,
 * and handles deep link navigation with proper error handling.
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDeepLinking, BookmarkData, ShareUrlConfig } from '../../utils/deep-linking';
import { getRouteConfig } from '../../config/routes';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * Props for BookmarkButton component
 */
interface BookmarkButtonProps {
  customTitle?: string;
  customDescription?: string;
  className?: string;
  onBookmarkCreated?: (bookmark: BookmarkData) => void;
}

/**
 * Bookmark Button Component
 * Creates bookmarks for the current page
 */
export function BookmarkButton({
  customTitle,
  customDescription,
  className = '',
  onBookmarkCreated
}: BookmarkButtonProps) {
  const location = useLocation();
  const { createBookmark } = useDeepLinking();
  const [isCreating, setIsCreating] = useState(false);
  const [bookmark, setBookmark] = useState<BookmarkData | null>(null);

  const handleCreateBookmark = async () => {
    setIsCreating(true);
    
    try {
      const routeConfig = getRouteConfig(location.pathname);
      const bookmarkData = createBookmark(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash
        },
        routeConfig,
        customTitle,
        customDescription
      );
      
      setBookmark(bookmarkData);
      onBookmarkCreated?.(bookmarkData);
      
      // Store bookmark in localStorage for persistence
      const existingBookmarks = JSON.parse(localStorage.getItem('userBookmarks') || '[]');
      const updatedBookmarks = [...existingBookmarks, bookmarkData];
      localStorage.setItem('userBookmarks', JSON.stringify(updatedBookmarks));
      
    } catch (error) {
      console.error('Failed to create bookmark:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateBookmark}
      disabled={isCreating}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Bookmark this page"
    >
      {isCreating ? (
        <LoadingSpinner size="sm" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
      {bookmark ? 'Bookmarked!' : 'Bookmark'}
    </button>
  );
}

/**
 * Props for ShareButton component
 */
interface ShareButtonProps {
  config?: ShareUrlConfig;
  className?: string;
  onShare?: (shareData: { url: string; title: string; description?: string }) => void;
}

/**
 * Share Button Component
 * Creates shareable URLs for the current page
 */
export function ShareButton({
  config = {},
  className = '',
  onShare
}: ShareButtonProps) {
  const location = useLocation();
  const { createShareUrl } = useDeepLinking();
  const [isSharing, setIsSharing] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; title: string; description?: string } | null>(null);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareUrlData = createShareUrl(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash
        },
        config
      );
      
      setShareData(shareUrlData);
      onShare?.(shareUrlData);
      
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: shareUrlData.title,
          text: shareUrlData.description,
          url: window.location.origin + shareUrlData.url
        });
      } else {
        // Fallback: copy to clipboard
        const fullUrl = window.location.origin + shareUrlData.url;
        await navigator.clipboard.writeText(fullUrl);
        
        // Show temporary feedback
        const button = document.activeElement as HTMLButtonElement;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
      
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Share this page"
    >
      {isSharing ? (
        <LoadingSpinner size="sm" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )}
      Share
    </button>
  );
}

/**
 * Props for DeepLinkNavigator component
 */
interface DeepLinkNavigatorProps {
  url: string;
  onNavigationComplete?: (success: boolean, errors?: string[]) => void;
  fallbackPath?: string;
}

/**
 * Deep Link Navigator Component
 * Handles navigation to deep links with proper authentication flow
 */
export function DeepLinkNavigator({
  url,
  onNavigationComplete,
  fallbackPath = '/'
}: DeepLinkNavigatorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleDeepLink } = useDeepLinking();
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const navigateToDeepLink = async () => {
      if (!url) return;
      
      setIsNavigating(true);
      setError(null);
      
      try {
        const result = await handleDeepLink(url, navigate, user);
        
        if (result.success) {
          if (result.redirectPath) {
            navigate(result.redirectPath);
          }
          onNavigationComplete?.(true);
        } else {
          setError(result.errors?.join(', ') || 'Navigation failed');
          onNavigationComplete?.(false, result.errors);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        onNavigationComplete?.(false, [errorMessage]);
      } finally {
        setIsNavigating(false);
      }
    };

    navigateToDeepLink();
  }, [url, navigate, user, handleDeepLink, onNavigationComplete]);

  if (isNavigating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Navigating to your destination...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Navigation Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(fallbackPath)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Props for BookmarkList component
 */
interface BookmarkListProps {
  className?: string;
  onBookmarkClick?: (bookmark: BookmarkData) => void;
  maxItems?: number;
}

/**
 * Bookmark List Component
 * Displays saved bookmarks with navigation functionality
 */
export function BookmarkList({
  className = '',
  onBookmarkClick,
  maxItems = 10
}: BookmarkListProps) {
  const navigate = useNavigate();
  const { handleDeepLink } = useDeepLinking();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const stored = localStorage.getItem('userBookmarks');
        const allBookmarks: BookmarkData[] = stored ? JSON.parse(stored) : [];
        
        // Sort by timestamp (newest first) and limit
        const sortedBookmarks = allBookmarks
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxItems);
        
        setBookmarks(sortedBookmarks);
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
        setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, [maxItems]);

  const handleBookmarkNavigation = async (bookmark: BookmarkData) => {
    onBookmarkClick?.(bookmark);
    
    try {
      const result = await handleDeepLink(bookmark.url, navigate, user);
      if (!result.success && result.errors) {
        console.error('Bookmark navigation failed:', result.errors);
      }
    } catch (error) {
      console.error('Failed to navigate to bookmark:', error);
    }
  };

  const removeBookmark = (index: number) => {
    const updatedBookmarks = bookmarks.filter((_, i) => i !== index);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('userBookmarks', JSON.stringify(updatedBookmarks));
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p>No bookmarks saved yet.</p>
        <p className="text-sm mt-1">Use the bookmark button to save pages for quick access.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Saved Bookmarks</h3>
      {bookmarks.map((bookmark, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <button
            onClick={() => handleBookmarkNavigation(bookmark)}
            className="flex-1 text-left"
          >
            <h4 className="font-medium text-gray-900 truncate">{bookmark.title}</h4>
            {bookmark.description && (
              <p className="text-sm text-gray-600 truncate mt-1">{bookmark.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(bookmark.timestamp).toLocaleDateString()}
            </p>
          </button>
          <button
            onClick={() => removeBookmark(index)}
            className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Remove bookmark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Combined Deep Link Actions Component
 * Provides bookmark and share functionality in a single component
 */
export function DeepLinkActions({
  bookmarkTitle,
  bookmarkDescription,
  shareConfig,
  className = ''
}: {
  bookmarkTitle?: string;
  bookmarkDescription?: string;
  shareConfig?: ShareUrlConfig;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BookmarkButton
        customTitle={bookmarkTitle}
        customDescription={bookmarkDescription}
      />
      <ShareButton config={shareConfig} />
    </div>
  );
}