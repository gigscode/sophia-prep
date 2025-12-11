import { useNavigation } from '../hooks/useNavigation';

/**
 * Debug component to display current navigation state
 * Useful for development and testing navigation functionality
 */
export function NavigationDebug() {
  const {
    currentPath,
    previousPath,
    isNavigating,
    pendingRedirect,
    navigationError,
    navigate,
    goBack,
    goForward,
    clearNavigationError,
  } = useNavigation();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Navigation Debug</h3>
      <div className="space-y-1">
        <div>
          <strong>Current:</strong> {currentPath}
        </div>
        <div>
          <strong>Previous:</strong> {previousPath || 'None'}
        </div>
        <div>
          <strong>Navigating:</strong> {isNavigating ? 'Yes' : 'No'}
        </div>
        {pendingRedirect && (
          <div>
            <strong>Pending:</strong> {pendingRedirect}
          </div>
        )}
        {navigationError && (
          <div className="text-red-300">
            <strong>Error:</strong> {navigationError}
            <button
              onClick={clearNavigationError}
              className="ml-2 text-xs bg-red-600 px-1 rounded"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 space-x-2">
        <button
          onClick={goBack}
          className="bg-blue-600 px-2 py-1 rounded text-xs"
          disabled={isNavigating}
        >
          Back
        </button>
        <button
          onClick={goForward}
          className="bg-blue-600 px-2 py-1 rounded text-xs"
          disabled={isNavigating}
        >
          Forward
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-green-600 px-2 py-1 rounded text-xs"
          disabled={isNavigating}
        >
          Home
        </button>
      </div>
    </div>
  );
}