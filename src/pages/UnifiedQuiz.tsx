import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { questionService, normalizeQuestions } from '../services/question-service';
import { subjectService } from '../services/subject-service';
import { analyticsService } from '../services/analytics-service';
import { timerService } from '../services/timer-service';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { OptionButton } from '../components/ui/OptionButton';
import { Button } from '../components/ui/Button';
import type { QuizConfig, QuizQuestion } from '../types/quiz-config';
import { QuizConfigHelpers } from '../types/quiz-config';
import type { TimerHandle } from '../services/timer-service';

interface UnifiedQuizProps {
  config?: QuizConfig;
}

/**
 * UnifiedQuiz Component
 * 
 * A unified quiz component that handles both practice and exam simulation modes
 * for WAEC and JAMB examinations with subject or year-based question selection.
 * 
 * Requirements: 2.2, 2.3, 5.1, 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 7.1, 7.2, 11.1, 11.2, 11.3
 */
export function UnifiedQuiz({ config: propConfig }: UnifiedQuizProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get config from props, location state, or sessionStorage
  const getConfig = (): QuizConfig | undefined => {
    if (propConfig) return propConfig;
    
    const locationConfig = (location.state as { config?: QuizConfig })?.config;
    if (locationConfig) return locationConfig;
    
    const sessionConfig = sessionStorage.getItem('quizConfig');
    if (sessionConfig) {
      try {
        return JSON.parse(sessionConfig) as QuizConfig;
      } catch (error) {
        console.error('Failed to parse quiz config from sessionStorage:', error);
      }
    }
    
    return undefined;
  };
  
  const config = getConfig();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerHandle, setTimerHandle] = useState<TimerHandle | null>(null);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerError, setTimerError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');

  // Persist quiz state to localStorage
  const persistState = useCallback(() => {
    if (!config) return;
    
    try {
      const state = {
        config,
        currentIndex,
        answers,
        startTime,
        completed,
        timestamp: Date.now()
      };
      localStorage.setItem('quizState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist quiz state:', error);
    }
  }, [config, currentIndex, answers, startTime, completed]);

  // Restore quiz state from localStorage
  useEffect(() => {
    if (!config) return;
    
    try {
      const savedState = localStorage.getItem('quizState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Check if saved state matches current config
        if (
          state.config &&
          state.config.examType === config.examType &&
          state.config.mode === config.mode &&
          state.config.selectionMethod === config.selectionMethod &&
          state.config.subjectSlug === config.subjectSlug &&
          state.config.year === config.year
        ) {
          // Restore state if it's recent (within 24 hours)
          const age = Date.now() - state.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            setCurrentIndex(state.currentIndex || 0);
            setAnswers(state.answers || {});
            setCompleted(state.completed || false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore quiz state:', error);
    }
  }, [config]);

  // Persist state whenever it changes
  useEffect(() => {
    persistState();
  }, [persistState]);

  // Validate configuration
  useEffect(() => {
    if (!config) {
      console.error('No quiz configuration provided');
      navigate('/quiz/mode-selection');
      return;
    }

    const validationError = QuizConfigHelpers.validateConfig(config);
    if (validationError) {
      console.error('Invalid quiz configuration:', validationError);
      navigate('/quiz/mode-selection');
    }
  }, [config, navigate]);

  // Load questions based on configuration
  useEffect(() => {
    if (!config) return;

    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let loadedQuestions: any[] = [];

        if (config.selectionMethod === 'subject' && config.subjectSlug) {
          // Load questions by subject
          const filters: any = {
            exam_type: config.examType,
            limit: 60
          };
          
          // Add year filter if provided
          if (config.year) {
            filters.exam_year = config.year;
          }

          loadedQuestions = await questionService.getQuestionsBySubjectSlug(
            config.subjectSlug,
            filters
          );
        } else if (config.selectionMethod === 'year' && config.year) {
          // Load questions by year
          // For year-based selection, we need to get all subjects for the exam type
          // and then filter by year
          const subjects = await subjectService.getSubjectsByExamType(config.examType);
          const allQuestions: any[] = [];

          for (const subject of subjects) {
            try {
              const subjectQuestions = await questionService.getQuestionsBySubjectSlug(
                subject.slug,
                {
                  exam_type: config.examType,
                  exam_year: config.year,
                  limit: 10 // Limit per subject to avoid too many questions
                }
              );
              allQuestions.push(...subjectQuestions);
            } catch (subjectError) {
              console.warn(`Failed to load questions for subject ${subject.slug}:`, subjectError);
              // Continue with other subjects
            }
          }

          loadedQuestions = allQuestions;
        }

        // Normalize questions
        const normalized = normalizeQuestions(loadedQuestions, {
          exam_type: config.examType,
          exam_year: config.year
        });

        if (normalized.length === 0) {
          setError('No questions available for the selected configuration. Please try a different selection.');
        }

        setQuestions(normalized);
      } catch (error) {
        console.error('Failed to load questions:', error);
        setError('Failed to load questions. Please check your connection and try again.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [config]);

  // Initialize timer for exam mode
  useEffect(() => {
    if (!config || config.mode !== 'exam' || questions.length === 0 || completed) return;

    const initializeTimer = async () => {
      setTimerError(false);
      
      try {
        // Check if there's a persisted timer
        const restoredTime = timerService.restoreTimer();
        
        let duration: number;
        if (restoredTime !== null && restoredTime > 0) {
          // Resume from persisted timer
          duration = restoredTime;
        } else {
          // Get timer duration from configuration
          duration = await timerService.getDuration({
            examType: config.examType,
            subjectSlug: config.subjectSlug,
            year: config.year
          });
        }

        setTimeRemaining(duration);

        // Start timer
        const handle = timerService.startTimer(
          duration,
          (remaining) => {
            setTimeRemaining(remaining);
          },
          () => {
            // Auto-submit on timer expiration
            handleAutoSubmit();
          }
        );

        setTimerHandle(handle);
      } catch (error) {
        console.error('Failed to initialize timer:', error);
        setTimerError(true);
        // Allow manual submission if timer fails
        setError('Timer initialization failed. You can still complete the quiz manually.');
      }
    };

    initializeTimer();

    // Cleanup timer on unmount
    return () => {
      if (timerHandle) {
        timerService.stopTimer(timerHandle);
      }
    };
  }, [config, questions.length, completed]);

  // Handle auto-submit when timer expires
  const handleAutoSubmit = useCallback(() => {
    setCompleted(true);
  }, []);

  // Handle manual submit
  const handleManualSubmit = useCallback(() => {
    if (config?.mode === 'exam' && timeRemaining && timeRemaining > 0 && !timerError) {
      // Prevent manual submit in exam mode while timer is active (unless timer failed)
      return;
    }
    setCompleted(true);
  }, [config, timeRemaining, timerError]);

  // Handle answer selection
  const handleSelectAnswer = useCallback((key: string) => {
    if (completed) return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    // In practice mode, show feedback immediately
    if (config?.mode === 'practice') {
      setSelectedAnswer(key);
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
      setShowFeedback(true);
      
      // Announce feedback to screen readers
      const isCorrect = key === currentQuestion.correct;
      setAnnouncement(isCorrect ? 'Correct answer!' : 'Incorrect answer. Please review the explanation.');
    } else {
      // In exam mode, just record the answer
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
      setAnnouncement(`Answer ${key} selected for question ${currentIndex + 1}`);
    }
  }, [completed, questions, currentIndex, config]);

  // Handle next question (practice mode)
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
      setAnnouncement(`Moving to question ${currentIndex + 2} of ${questions.length}`);
    } else {
      // Last question - complete the quiz
      setCompleted(true);
      setAnnouncement('Quiz completed. Calculating results...');
    }
  }, [currentIndex, questions.length]);

  // Handle previous question
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
      setAnnouncement(`Moving to question ${currentIndex} of ${questions.length}`);
    }
  }, [currentIndex, questions.length]);

  // Navigate to results when completed
  useEffect(() => {
    if (!completed || questions.length === 0 || !config || submitting) return;

    const saveAndNavigate = async () => {
      setSubmitting(true);
      
      try {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const calculatedScore = questions.reduce(
          (acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0),
          0
        );

        // Get subject_id if subject-based
        let subject_id: string | undefined;
        if (config.selectionMethod === 'subject' && config.subjectSlug) {
          try {
            const subject = await subjectService.getSubjectBySlug(config.subjectSlug);
            subject_id = subject?.id;
          } catch (error) {
            console.error('Failed to get subject:', error);
            // Continue without subject_id
          }
        }

        // Save quiz attempt with retry logic
        const quizModeIdentifier = QuizConfigHelpers.getQuizModeIdentifier(config);
        let saveAttempts = 0;
        const maxAttempts = 3;
        let saved = false;

        while (saveAttempts < maxAttempts && !saved) {
          try {
            await analyticsService.saveQuizAttempt({
              subject_id,
              quiz_mode: quizModeIdentifier as any,
              exam_type: config.examType,
              exam_year: config.year,
              total_questions: questions.length,
              correct_answers: calculatedScore,
              time_taken_seconds: timeTaken,
              questions_data: questions.map(q => ({
                question_id: q.id,
                user_answer: answers[q.id],
                correct_answer: q.correct,
                is_correct: answers[q.id] === q.correct
              }))
            });
            saved = true;
          } catch (saveError) {
            saveAttempts++;
            console.error(`Failed to save quiz attempt (attempt ${saveAttempts}):`, saveError);
            
            if (saveAttempts < maxAttempts) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
            } else {
              // Queue for later if all attempts fail
              try {
                const queuedAttempt = {
                  subject_id,
                  quiz_mode: quizModeIdentifier,
                  exam_type: config.examType,
                  exam_year: config.year,
                  total_questions: questions.length,
                  correct_answers: calculatedScore,
                  time_taken_seconds: timeTaken,
                  questions_data: questions.map(q => ({
                    question_id: q.id,
                    user_answer: answers[q.id],
                    correct_answer: q.correct,
                    is_correct: answers[q.id] === q.correct
                  })),
                  timestamp: Date.now()
                };
                
                const queue = JSON.parse(localStorage.getItem('quizAttemptQueue') || '[]');
                queue.push(queuedAttempt);
                localStorage.setItem('quizAttemptQueue', JSON.stringify(queue));
                
                console.log('Quiz attempt queued for later submission');
              } catch (queueError) {
                console.error('Failed to queue quiz attempt:', queueError);
              }
            }
          }
        }

        // Stop timer if active
        if (timerHandle) {
          timerService.stopTimer(timerHandle);
        }

        // Clear persisted quiz state
        localStorage.removeItem('quizState');

        // Navigate to results
        navigate('/quiz/results', {
          state: {
            questions,
            answers,
            score: calculatedScore,
            totalQuestions: questions.length,
            timeTaken,
            quizMode: QuizConfigHelpers.getModeLabel(config.mode),
            examType: config.examType,
            subject: config.subjectSlug,
            year: config.year,
            config,
            saveError: !saved
          }
        });
      } catch (error) {
        console.error('Error in saveAndNavigate:', error);
        setError('Failed to save quiz results. Your progress has been saved locally.');
        setSubmitting(false);
      }
    };

    saveAndNavigate();
  }, [completed, questions, answers, config, startTime, navigate, timerHandle, submitting]);

  // Keyboard navigation
  useEffect(() => {
    if (completed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // In practice mode with feedback showing, only allow Enter to proceed
      if (config?.mode === 'practice' && showFeedback) {
        if (e.key === 'Enter') {
          handleNext();
        }
        return;
      }

      // Answer selection
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectAnswer(key);
      }

      // Navigation
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
      if (e.key === 'ArrowRight' && config?.mode === 'exam') {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }

      // Submit
      if (e.key === 'Enter' && config?.mode === 'practice' && !showFeedback) {
        handleManualSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completed, config, showFeedback, handleSelectAnswer, handleNext, handlePrevious, handleManualSubmit, currentIndex, questions.length]);

  // Calculate score
  const score = useMemo(() => {
    return questions.reduce(
      (acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0),
      0
    );
  }, [questions, answers]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading || !config) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">
          {config ? QuizConfigHelpers.getModeLabel(config.mode) : 'Loading...'}
        </h1>
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </Card>
      </div>
    );
  }

  // No questions available or error loading
  if (questions.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">
          {QuizConfigHelpers.getModeLabel(config.mode)}
        </h1>
        <Card>
          <div className="text-center py-8">
            {error ? (
              <>
                <div className="text-red-600 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-lg">{error}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => window.location.reload()} variant="ghost">
                    Retry
                  </Button>
                  <Button onClick={() => navigate('/quiz/mode-selection')}>
                    Back to Mode Selection
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  No questions available for the selected configuration.
                </p>
                <Button onClick={() => navigate('/quiz/mode-selection')}>
                  Back to Mode Selection
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isPracticeMode = config.mode === 'practice';
  const isExamMode = config.mode === 'exam';
  const isCorrect = selectedAnswer === currentQuestion?.correct;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Skip link for keyboard navigation */}
      <a
        href="#quiz-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to quiz content
      </a>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">
        {config.examType} - {QuizConfigHelpers.getModeLabel(config.mode)}
      </h1>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-yellow-600 hover:text-yellow-800"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div id="quiz-content" tabIndex={-1}>
        <Card>
        {/* Header with progress and timer */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="text-sm text-gray-600" aria-label={`Question ${currentIndex + 1} of ${questions.length}`}>
            Question <span className="font-semibold">{currentIndex + 1}</span> of{' '}
            <span className="font-semibold">{questions.length}</span>
          </div>

          {/* Timer display for exam mode */}
          {isExamMode && timeRemaining !== null && (
            <div
              className={`text-sm md:text-base font-mono font-semibold ${
                timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'
              }`}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
            >
              Time: {formatTime(timeRemaining)}
              {timeRemaining < 300 && (
                <span className="sr-only"> Warning: Less than 5 minutes remaining</span>
              )}
            </div>
          )}

          {/* Score display for practice mode */}
          {isPracticeMode && (
            <div className="text-sm text-gray-600" aria-label={`Current score: ${score} out of ${currentIndex + 1}`}>
              Score: <span className="font-semibold">{score}</span>
            </div>
          )}
        </div>

        <ProgressBar 
          value={currentIndex + 1} 
          max={questions.length} 
          className="mb-5"
          aria-label={`Quiz progress: ${currentIndex + 1} of ${questions.length} questions`}
        />

        {/* Question */}
        <div className="mb-4" role="group" aria-labelledby="question-text">
          <div id="question-text" className="text-base md:text-lg font-semibold mb-3">
            {currentQuestion.text}
          </div>

          {/* Options */}
          <div 
            className="grid grid-cols-1 gap-3" 
            role="radiogroup" 
            aria-labelledby="question-text"
            aria-required="true"
          >
            {currentQuestion.options.map((opt) => (
              <OptionButton
                key={opt.key}
                optionKey={opt.key}
                text={opt.text}
                selected={
                  isPracticeMode
                    ? selectedAnswer === opt.key
                    : answers[currentQuestion.id] === opt.key
                }
                onSelect={handleSelectAnswer}
                disabled={isPracticeMode && showFeedback}
              />
            ))}
          </div>
        </div>

        {/* Feedback for practice mode */}
        {isPracticeMode && showFeedback && (
          <div
            className={`mt-6 p-4 rounded-lg border ${
              isCorrect
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
            role="alert"
            aria-live="polite"
          >
            <div
              className={`font-semibold ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            {currentQuestion.explanation && (
              <p className="text-gray-700 mt-2">{currentQuestion.explanation}</p>
            )}
            <div className="mt-4">
              <Button variant="primary" onClick={handleNext}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation controls for exam mode */}
        {isExamMode && (
          <nav className="mt-6 flex items-center gap-3 flex-wrap" aria-label="Quiz navigation">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-3"
              aria-label="Go to previous question"
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                  setAnnouncement(`Moving to question ${currentIndex + 2} of ${questions.length}`);
                }
              }}
              disabled={currentIndex === questions.length - 1}
              aria-label="Go to next question"
            >
              Next
            </Button>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-sm text-gray-500" aria-live="polite">
                Selected: <span className="font-semibold">{answers[currentQuestion.id] ?? '—'}</span>
              </div>
              <Button
                variant="primary"
                onClick={handleManualSubmit}
                disabled={timeRemaining !== null && timeRemaining > 0 && !timerError}
                aria-label={
                  timerError
                    ? 'Timer failed - you can submit manually'
                    : timeRemaining !== null && timeRemaining > 0
                    ? 'Submit will be enabled when timer expires'
                    : 'Submit exam'
                }
                title={
                  timerError
                    ? 'Timer failed - you can submit manually'
                    : timeRemaining !== null && timeRemaining > 0
                    ? 'Submit will be enabled when timer expires'
                    : 'Submit exam'
                }
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            </div>
          </nav>
        )}

        {/* Manual submit for practice mode (when not showing feedback) */}
        {isPracticeMode && !showFeedback && (
          <div className="mt-6 flex justify-end">
            <Button 
              variant="primary" 
              onClick={handleManualSubmit} 
              disabled={submitting}
              aria-label="Complete quiz and view results"
            >
              {submitting ? 'Submitting...' : 'Complete Quiz'}
            </Button>
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}
