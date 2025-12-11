/**
 * Deep Linking Demo Component
 * 
 * Demonstrates the deep linking functionality including
 * bookmark creation, sharing, and URL validation.
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookmarkButton, 
  ShareButton, 
  BookmarkList, 
  DeepLinkActions 
} from '../routing/DeepLinkHandler';
import { 
  useDeepLinking, 
  isSafeUrl, 
  generateRouteDeepLink 
} from '../../utils/deep-linking';

export function DeepLinkingDemo() {
  const location = useLocation();
  const { validateDeepLink, generateDeepLink } = useDeepLinking();
  const [testUrl, setTestUrl] = useState('/subjects/mathematics?mode=practice');
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidateUrl = () => {
    const result = validateDeepLink(testUrl);
    setValidationResult(result);
  };

  const handleGenerateDeepLink = () => {
    const result = generateDeepLink(
      '/subjects/:slug',
      { slug: 'physics' },
      { mode: 'exam', level: 'advanced' },
      'section2'
    );
    setTestUrl(result.url || 'Generation failed');
    setValidationResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Deep Linking Demo</h1>
        
        {/* Current Page Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Page Actions</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Current URL: <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname + location.search}</code>
            </p>
          </div>
          
          <DeepLinkActions
            bookmarkTitle="Demo Page Bookmark"
            bookmarkDescription="This is a demonstration of the deep linking functionality"
            shareConfig={{ includeQueryParams: true, includeHash: false }}
            className="mb-4"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BookmarkButton
              customTitle="Custom Bookmark Title"
              customDescription="Custom bookmark description"
              className="w-full"
            />
            <ShareButton
              config={{ 
                includeQueryParams: false, 
                customTitle: "Check out this page!",
                customDescription: "Shared from the deep linking demo"
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* URL Validation Testing */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">URL Validation Testing</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="test-url" className="block text-sm font-medium text-gray-700 mb-2">
                Test URL:
              </label>
              <div className="flex gap-2">
                <input
                  id="test-url"
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a URL to validate..."
                />
                <button
                  onClick={handleValidateUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Validate
                </button>
                <button
                  onClick={handleGenerateDeepLink}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Generate Sample
                </button>
              </div>
            </div>

            {/* URL Safety Check */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Safety Check:</h3>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${isSafeUrl(testUrl) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">
                  {isSafeUrl(testUrl) ? 'URL is safe' : 'URL may be unsafe'}
                </span>
              </div>
            </div>

            {/* Validation Results */}
            {validationResult && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Validation Results:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${validationResult.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Valid: {validationResult.isValid ? 'Yes' : 'No'}</span>
                  </div>
                  
                  {validationResult.routeConfig && (
                    <div>
                      <strong>Route:</strong> {validationResult.routeConfig.path}
                    </div>
                  )}
                  
                  {validationResult.routeParams && Object.keys(validationResult.routeParams).length > 0 && (
                    <div>
                      <strong>Route Params:</strong> {JSON.stringify(validationResult.routeParams)}
                    </div>
                  )}
                  
                  {validationResult.queryParams && Object.keys(validationResult.queryParams).length > 0 && (
                    <div>
                      <strong>Query Params:</strong> {JSON.stringify(validationResult.queryParams)}
                    </div>
                  )}
                  
                  {validationResult.requiresAuth && (
                    <div className="text-orange-600">
                      <strong>⚠️ Requires Authentication</strong>
                    </div>
                  )}
                  
                  {validationResult.requiresAdmin && (
                    <div className="text-red-600">
                      <strong>🔒 Requires Admin Privileges</strong>
                    </div>
                  )}
                  
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div>
                      <strong className="text-red-600">Errors:</strong>
                      <ul className="list-disc list-inside ml-4 text-red-600">
                        {validationResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sample URLs for Testing */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sample URLs for Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Valid Subject Page', url: '/subjects/mathematics?mode=practice' },
              { label: 'Valid Quiz Page', url: '/quiz/unified?subject=physics&mode=exam' },
              { label: 'Protected Profile Page', url: '/profile' },
              { label: 'Admin Page', url: '/admin' },
              { label: 'Invalid Route', url: '/nonexistent/page' },
              { label: 'Unsafe URL', url: 'javascript:alert("xss")' }
            ].map((sample, index) => (
              <button
                key={index}
                onClick={() => setTestUrl(sample.url)}
                className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="font-medium text-gray-800">{sample.label}</div>
                <div className="text-sm text-gray-600 font-mono">{sample.url}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Bookmarks */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Saved Bookmarks</h2>
          <BookmarkList
            maxItems={5}
            onBookmarkClick={(bookmark) => {
              console.log('Bookmark clicked:', bookmark);
            }}
          />
        </div>
      </div>
    </div>
  );
}