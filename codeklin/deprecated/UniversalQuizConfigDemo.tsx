import { UniversalQuizConfigProvider, useUniversalQuizConfigContext } from '../contexts/UniversalQuizConfigContext';
import { UniversalQuizConfigurationFlow } from '../components/quiz/UniversalQuizConfigurationFlow';

/**
 * Configuration Status Display Component
 * Shows current configuration state and mode-specific behavior flags
 */
function ConfigurationStatus() {
  const { config, getModeSpecificBehavior, getConfigurationSummary } = useUniversalQuizConfigContext();
  const behavior = getModeSpecificBehavior();
  const summary = getConfigurationSummary();

  return (
    <div className="bg-white rounded-lg border p-6 sticky top-8">
      <h3 className="text-lg font-semibold mb-4">Configuration Status</h3>
      
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium text-gray-700">Current Step</h4>
          <p className="text-gray-600 capitalize">{config.currentStep.replace('-', ' ')}</p>
        </div>

        {config.examType && (
          <div>
            <h4 className="font-medium text-gray-700">Exam Type</h4>
            <p className="text-gray-600">{summary.examTypeName}</p>
          </div>
        )}

        {config.mode && (
          <div>
            <h4 className="font-medium text-gray-700">Quiz Mode</h4>
            <p className="text-gray-600">{summary.modeName}</p>
          </div>
        )}

        {config.selectedSubjects.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700">Subjects</h4>
            <p className="text-gray-600">{summary.subjectCount} selected</p>
          </div>
        )}

        {config.mode && (
          <div>
            <h4 className="font-medium text-gray-700">Mode-Specific Behavior</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Timer:</span>
                <span className={behavior.hasTimer ? 'text-red-600' : 'text-green-600'}>
                  {behavior.hasTimer ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Immediate Explanations:</span>
                <span className={behavior.showImmediateExplanations ? 'text-green-600' : 'text-red-600'}>
                  {behavior.showImmediateExplanations ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Review Mode:</span>
                <span className={behavior.allowReviewMode ? 'text-green-600' : 'text-red-600'}>
                  {behavior.allowReviewMode ? 'Allowed' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shuffle Questions:</span>
                <span className={behavior.shuffleQuestions ? 'text-blue-600' : 'text-gray-600'}>
                  {behavior.shuffleQuestions ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bookmarking:</span>
                <span className={behavior.enableBookmarking ? 'text-green-600' : 'text-red-600'}>
                  {behavior.enableBookmarking ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500">
            <div>Version: {summary.version}</div>
            <div>Last Modified: {new Date(summary.lastModified).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Quiz Configuration Demo Page
 * Demonstrates the complete universal quiz configuration system
 */
export function UniversalQuizConfigDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Universal Quiz Configuration System
          </h1>
          <p className="text-gray-600 mt-1">
            Configure your JAMB or WAEC quiz with Practice or CBT exam modes
          </p>
        </div>
      </div>

      <div className="py-8">
        <UniversalQuizConfigProvider>
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <UniversalQuizConfigurationFlow />
              </div>
              <div className="lg:col-span-1">
                <ConfigurationStatus />
              </div>
            </div>
          </div>
        </UniversalQuizConfigProvider>
      </div>

      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">System Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Universal exam type selection (JAMB/WAEC)</li>
                <li>• Adaptive quiz modes (Practice/CBT)</li>
                <li>• Exam-specific validation rules</li>
                <li>• Persistent configuration state</li>
                <li>• Step-by-step guided flow</li>
                <li>• Real-time validation feedback</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Mode Differences</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-700">Practice Mode</h4>
                  <p className="text-gray-600">Unlimited time, immediate explanations, 5-100 questions</p>
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    <li>• Review mode enabled</li>
                    <li>• Questions not shuffled</li>
                    <li>• Bookmarking enabled</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700">CBT Exam Mode</h4>
                  <p className="text-gray-600">1-minute timer, delayed explanations, 5-180 questions, exam year selection</p>
                  <ul className="mt-2 text-xs text-gray-500 space-y-1">
                    <li>• Review mode disabled</li>
                    <li>• Questions shuffled</li>
                    <li>• Auto-submit on timeout</li>
                    <li>• Bookmarking disabled</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}