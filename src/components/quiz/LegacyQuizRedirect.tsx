/**
 * LegacyQuizRedirect Component
 * 
 * Handles legacy quiz route redirects by parsing query parameters
 * and redirecting to the unified quiz interface with proper configuration.
 * 
 * This component provides a seamless transition from legacy routes
 * (/quiz/practice and /quiz/cbt) to the new unified quiz system.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.2, 3.3, 3.4
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { QuizMode } from '../../types/quiz-config';
import { parseLegacyQuizParams, buildQuizConfigFromLegacy } from '../../utils/quiz-navigation';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface LegacyQuizRedirectProps {
  /** Quiz mode: 'practice' for untimed practice, 'exam' for timed simulation */
  mode: QuizMode;
}

/**
 * LegacyQuizRedirect Component
 * 
 * Parses legacy URL query parameters and redirects to the unified quiz
 * interface with proper configuration. Falls back to mode selection page
 * if parameters are invalid or missing.
 * 
 * @param props - Component props
 * @param props.mode - Quiz mode (practice or exam)
 */
export function LegacyQuizRedirect({ mode }: LegacyQuizRedirectProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Parse query parameters from URL
        const params = parseLegacyQuizParams(searchParams);

        // Build quiz config from parsed parameters
        const config = await buildQuizConfigFromLegacy(mode, params);

        if (config) {
          // Success: redirect to unified quiz with config
          // Store config in sessionStorage for UnifiedQuiz to retrieve
          sessionStorage.setItem('quizConfig', JSON.stringify(config));
          
          // Navigate to unified quiz
          navigate('/quiz/unified', { 
            replace: true,
            state: { config }
          });
        } else {
          // Failed to build config: redirect to mode selection
          setError('Unable to configure quiz. Redirecting to mode selection...');
          
          // Delay redirect slightly to show error message
          setTimeout(() => {
            navigate('/quiz/mode-selection', { replace: true });
          }, 1000);
        }
      } catch (err) {
        // Error during processing: redirect to mode selection
        console.error('Error processing legacy quiz redirect:', err);
        setError('An error occurred. Redirecting to mode selection...');
        
        // Delay redirect slightly to show error message
        setTimeout(() => {
          navigate('/quiz/mode-selection', { replace: true });
        }, 1000);
      }
    };

    handleRedirect();
  }, [mode, searchParams, navigate]);

  // Show loading state while processing
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg text-gray-700">
          {error || 'Loading quiz...'}
        </p>
      </div>
    </div>
  );
}
