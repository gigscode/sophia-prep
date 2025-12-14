import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';

/**
 * NotFoundPage component displays a user-friendly 404 error page
 * 
 * Features:
 * - Clear error messaging for non-existent routes
 * - Navigation options to help users find their way
 * - Helpful suggestions based on the attempted URL
 * - Proper SEO and accessibility considerations
 * 
 * Requirements: 2.5, 3.2
 */
export function NotFoundPage() {
  const location = useLocation();
  const { navigate } = useNavigation();

  // Log 404 errors for monitoring
  useEffect(() => {
    console.warn(`[404] Page not found: ${location.pathname}`);

    // Report to analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      if (typeof gtag === 'function') {
        gtag('event', 'page_not_found', {
          page_path: location.pathname
        });
      }
    }
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  // Suggest alternative routes based on the attempted path
  const getSuggestions = () => {
    const path = location.pathname.toLowerCase();
    const suggestions = [];

    if (path.includes('quiz') || path.includes('test') || path.includes('exam')) {
      suggestions.push({ label: 'Take a Quiz', path: '/quiz' });
    }
    if (path.includes('subject') || path.includes('course')) {
      suggestions.push({ label: 'Practice Questions', path: '/practice' });
    }
    if (path.includes('study') || path.includes('learn')) {
      suggestions.push({ label: 'Study Hub', path: '/study' });
    }
    if (path.includes('profile') || path.includes('account')) {
      suggestions.push({ label: 'Your Profile', path: '/profile' });
    }
    if (path.includes('help') || path.includes('support')) {
      suggestions.push({ label: 'Help Center', path: '/help' });
    }

    // Default suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push(
        { label: 'Practice Questions', path: '/practice' },
        { label: 'Take a Quiz', path: '/quiz' },
        { label: 'Study Hub', path: '/study' }
      );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const suggestions = getSuggestions();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
        {/* 404 Icon */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-2">
          Sorry, we couldn't find the page you're looking for.
        </p>

        {/* Show the attempted URL */}
        <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-100 px-3 py-2 rounded">
          {location.pathname}
        </p>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">You might be looking for:</p>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => navigate(suggestion.path)}
                  className="w-full py-2 px-4 text-left bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </button>
        </div>

        {/* Help Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still having trouble?{' '}
            <button
              onClick={() => navigate('/help')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}