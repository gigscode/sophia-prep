/**
 * URL Persistence Demo Component
 * 
 * Demonstrates URL parameter persistence functionality
 * for testing and verification purposes.
 */

import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useUrlParams } from '../../hooks/useUrlParams';
import { useNavigation } from '../../hooks/useNavigation';
import { useUrlPersistence } from '../navigation/UnifiedNavigationProvider';

export function UrlPersistenceDemo() {
  const location = useLocation();
  const params = useParams();
  const {
    queryParams,
    getQueryParam,
    setQueryParam,
    setQueryParams,
    navigateWithParams,
    preserveParams,
    restoreParams,
    validateCurrentParams
  } = useUrlParams();
  
  const { navigate, preservedParams } = useNavigation();
  
  const {
    preserveCurrentUrl,
    restorePreservedUrl,
    validateCurrentUrl,
    clearPersistedUrls,
    isUrlValid,
    validationErrors
  } = useUrlPersistence();

  const [testValue, setTestValue] = useState('');
  const [demoResults, setDemoResults] = useState<{
    preservation?: any;
    restoration?: any;
    validation?: any;
  }>({});

  // Validation configuration for demo
  const validators = {
    queryValidators: {
      subject: (value: string) => /^[a-zA-Z0-9\-_]+$/.test(value),
      mode: (value: string) => ['practice', 'exam', 'timed', 'untimed'].includes(value),
      level: (value: string) => ['beginner', 'intermediate', 'advanced'].includes(value)
    },
    routeValidators: {
      slug: (value: string) => /^[a-zA-Z0-9\-_]+$/.test(value),
      id: (value: string) => /^\d+$/.test(value) && parseInt(value, 10) > 0
    }
  };

  // Restore parameters on component mount
  useEffect(() => {
    const restored = restoreParams();
    if (restored) {
      console.log('URL parameters restored from preserved state');
    }
  }, [restoreParams]);

  const handleSetParam = () => {
    if (testValue.trim()) {
      setQueryParam('test', testValue, { preserve: true });
      setTestValue('');
    }
  };

  const handleSetMultipleParams = () => {
    setQueryParams({
      subject: 'mathematics',
      mode: 'practice',
      level: 'advanced'
    }, { preserve: true, merge: true });
  };

  const handleNavigateWithParams = () => {
    navigateWithParams('/quiz/unified', {
      subject: 'english',
      mode: 'exam'
    }, { preserveQuery: true });
  };

  const handlePreserveAndNavigate = () => {
    preserveParams(['subject', 'mode', 'level']);
    navigate('/subjects');
  };

  const handleRestoreParams = () => {
    const restored = restoreParams();
    if (!restored) {
      alert('No preserved parameters to restore');
    }
  };

  // Handle URL preservation
  const handlePreserveUrl = () => {
    const result = preserveCurrentUrl();
    setDemoResults(prev => ({ ...prev, preservation: result }));
  };

  // Handle URL restoration
  const handleRestoreUrl = () => {
    const result = restorePreservedUrl({ replace: false });
    setDemoResults(prev => ({ ...prev, restoration: result }));
  };

  // Handle validation
  const handleValidateUrl = () => {
    const result = validateCurrentUrl();
    const paramValidation = validateCurrentParams(validators);
    setDemoResults(prev => ({ 
      ...prev, 
      validation: { 
        urlValidation: result, 
        paramValidation 
      } 
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">URL Parameter Persistence Demo</h2>
      
      {/* Current State Display */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Current URL State</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Pathname:</strong> {location.pathname}</div>
          <div><strong>Search:</strong> {location.search || '(none)'}</div>
          <div><strong>Hash:</strong> {location.hash || '(none)'}</div>
          <div><strong>Route Params:</strong> {JSON.stringify(params, null, 2)}</div>
          <div><strong>Query Parameters:</strong> {JSON.stringify(queryParams, null, 2)}</div>
          <div><strong>Preserved Parameters:</strong> {JSON.stringify(preservedParams, null, 2)}</div>
          <div><strong>Current URL:</strong> {window.location.href}</div>
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-white">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isUrlValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium">
              URL Validation: {isUrlValid ? 'Valid' : 'Invalid'}
            </span>
          </div>
          {validationErrors.length > 0 && (
            <div className="mt-2">
              <strong>Errors:</strong>
              <ul className="list-disc list-inside text-red-600">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Single Parameter */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Single Parameter</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Enter test value"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={handleSetParam}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Set Test Param
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Current test param: {getQueryParam('test') || 'None'}
            </div>
          </div>
        </div>

        {/* Multiple Parameters */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Multiple Parameters</h3>
          <div className="space-y-3">
            <button
              onClick={handleSetMultipleParams}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Set Quiz Parameters
            </button>
            <div className="text-sm text-gray-600">
              Sets: subject=mathematics, mode=practice, level=advanced
            </div>
          </div>
        </div>

        {/* Navigation with Parameters */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Navigate with Parameters</h3>
          <div className="space-y-3">
            <button
              onClick={handleNavigateWithParams}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Navigate to Quiz
            </button>
            <div className="text-sm text-gray-600">
              Navigates to /quiz/unified with parameters, preserving existing query params
            </div>
          </div>
        </div>

        {/* Parameter Preservation */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Parameter Preservation</h3>
          <div className="space-y-3">
            <button
              onClick={handlePreserveAndNavigate}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Preserve & Navigate
            </button>
            <button
              onClick={handleRestoreParams}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Restore Parameters
            </button>
            <div className="text-sm text-gray-600">
              Preserve current params, navigate away, then restore them
            </div>
          </div>
        </div>

        {/* Enhanced URL Persistence */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Enhanced URL Persistence</h3>
          <div className="space-y-3">
            <button
              onClick={handlePreserveUrl}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Preserve Current URL
            </button>
            <button
              onClick={handleRestoreUrl}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Restore Preserved URL
            </button>
            <button
              onClick={handleValidateUrl}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Validate URL
            </button>
            <button
              onClick={() => clearPersistedUrls()}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Preserved URLs
            </button>
            <div className="text-sm text-gray-600">
              Enhanced URL persistence with validation and error handling
            </div>
          </div>
        </div>
      </div>

      {/* Demo Results */}
      {Object.keys(demoResults).length > 0 && (
        <div className="mt-6 bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Demo Results</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(demoResults, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Set some parameters using the controls above</li>
          <li>Refresh the page - parameters should be preserved</li>
          <li>Navigate to different pages and back - state should persist</li>
          <li>Use browser back/forward buttons - navigation should work correctly</li>
          <li>Try preserving parameters and restoring them after navigation</li>
        </ol>
      </div>
    </div>
  );
}