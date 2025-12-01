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
import type { QuizConfig, QuizState, QuizQuestion } from '../types/quiz-config';
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
  
  // Get config from props or location state
  const config = propConfig || (location.state as { config?: QuizConfig })?.config;

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
            const subjectQuestions = await questionService.getQuestionsBySubjectSlug(
              subject.slug,
              {
                exam_type: config.examType,
                exam_year: config.year,
                limit: 10 // Limit per subject to avoid too many questions
              }
            );
            allQuestions.push(...subjectQuestions);
          }

          loadedQuestions = allQuestions;
        }

        // Normalize questions
        const normalized = normalizeQuestions(loadedQuestions, {
          exam_type: config.examType,
          exam_year: config.year
        });

        setQuestions(normalized);
      } catch (error) {
        console.error('Failed to load questions:', error);
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
      try {
        // Get timer duration from configuration
        const duration = await timerService.getDuration({
          examType: config.examType,
          subjectSlug: config.subjectSlug,
          year: config.year
        });

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
    if (config?.mode === 'exam' && timeRemaining && timeRemaining > 0) {
      // Prevent manual submit in exam mode while timer is active
      return;
    }
    setCompleted(true);
  }, [config, timeRemaining]);

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
    } else {
      // In exam mode, just record the answer
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: key }));
    }
  }, [completed, questions, currentIndex, config]);

  // Handle next question (practice mode)
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
    } else {
      // Last question - complete the quiz
      setCompleted(true);
    }
  }, [currentIndex, questions.length]);

  // Handle previous question
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
    }
  }, [currentIndex]);

  // Navigate to results when completed
  useEffect(() => {
    if (!completed || questions.length === 0 || !config) return;

    const saveAndNavigate = async () => {
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
        }
      }

      // Save quiz attempt
      const quizModeIdentifier = QuizConfigHelpers.getQuizModeIdentifier(config);
      await analyticsService.saveQuizAttempt({
        subject_id,
        quiz_mode: quizModeIdentifier as any,
        total_questions: questions.length,
        correct_answers: calculatedScore,
        time_taken_seconds: timeTaken,
        exam_year: config.year,
        questions_data: questions.map(q => ({
          question_id: q.id,
          user_answer: answers[q.id],
          correct_answer: q.correct,
          is_correct: answers[q.id] === q.correct
        }))
      });

      // Stop timer if active
      if (timerHandle) {
        timerService.stopTimer(timerHandle);
      }

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
          config
        }
      });
    };

    saveAndNavigate();
  }, [completed, questions, answers, config, startTime, navigate, timerHandle]);

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

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">
          {QuizConfigHelpers.getModeLabel(config.mode)}
        </h1>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No questions available for the selected configuration.
            </p>
            <Button onClick={() => navigate('/quiz/mode-selection')}>
              Back to Mode Selection
            </Button>
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
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">
        {config.examType} - {QuizConfigHelpers.getModeLabel(config.mode)}
      </h1>

      <Card>
        {/* Header with progress and timer */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="text-sm text-gray-600">
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
            >
              Time: {formatTime(timeRemaining)}
            </div>
          )}

          {/* Score display for practice mode */}
          {isPracticeMode && (
            <div className="text-sm text-gray-600">
              Score: <span className="font-semibold">{score}</span>
            </div>
          )}
        </div>

        <ProgressBar value={currentIndex + 1} max={questions.length} className="mb-5" />

        {/* Question */}
        <div className="mb-4">
          <div className="text-base md:text-lg font-semibold mb-3">
            {currentQuestion.text}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
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
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-3"
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (currentIndex < questions.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                }
              }}
              disabled={currentIndex === questions.length - 1}
            >
              Next
            </Button>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Selected: <span className="font-semibold">{answers[currentQuestion.id] ?? '—'}</span>
              </div>
              <Button
                variant="primary"
                onClick={handleManualSubmit}
                disabled={timeRemaining !== null && timeRemaining > 0}
                title={
                  timeRemaining !== null && timeRemaining > 0
                    ? 'Submit will be enabled when timer expires'
                    : 'Submit exam'
                }
              >
                Submit Exam
              </Button>
            </div>
          </div>
        )}

        {/* Manual submit for practice mode (when not showing feedback) */}
        {isPracticeMode && !showFeedback && (
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleManualSubmit}>
              Complete Quiz
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
