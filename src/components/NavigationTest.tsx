import { useNavigation } from '../hooks/useNavigation';
import { useLocation } from 'react-router-dom';

/**
 * Simple test component to verify navigation state manager functionality
 * This can be temporarily added to any page to test navigation features
 */
export function NavigationTest() {
  const navigation = useNavigation();
  const location = useLocation();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 m-4">
      <h3 className="font-bold text-blue-800 mb-2">Navigation State Test</h3>
      <div className="text-sm space-y-1">
        <div><strong>Current Path:</strong> {navigation.currentPath}</div>
        <div><strong>Previous Path:</strong> {navigation.previousPath || 'None'}</div>
        <div><strong>Is Navigating:</strong> {navigation.isNavigating ? 'Yes' : 'No'}</div>
        <div><strong>Location Pathname:</strong> {location.pathname}</div>
        {navigation.pendingRedirect && (
          <div><strong>Pending Redirect:</strong> {navigation.pendingRedirect}</div>
        )}
        {navigation.navigationError && (
          <div className="text-red-600">
            <strong>Error:</strong> {navigation.navigationError}
          </div>
        )}
      </div>
      <div className="mt-2 space-x-2">
        <button
          onClick={() => navigation.navigate('/subjects')}
          className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
          disabled={navigation.isNavigating}
        >
          Go to Subjects
        </button>
        <button
          onClick={() => navigation.navigate('/about')}
          className="bg-green-600 text-white px-2 py-1 rounded text-xs"
          disabled={navigation.isNavigating}
        >
          Go to About
        </button>
        <button
          onClick={navigation.goBack}
          className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
          disabled={navigation.isNavigating}
        >
          Back
        </button>
      </div>
    </div>
  );
}