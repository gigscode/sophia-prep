import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigation } from '../hooks/useNavigation';
import { CheckCircle, XCircle, Home, RotateCcw, BookOpen } from 'lucide-react';
import type { QuizConfig } from '../types/quiz-config';
import { QuizConfigHelpers } from '../types/quiz-config';

interface QuizQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correct?: string;
  explanation?: string;
  exam_year?: number | null;
  exam_type?: 'JAMB' | 'WAEC' | null;
  topic?: string;
}

interface QuizResultsData {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  timeTaken?: number;
  quizMode?: string;
  examType?: 'JAMB' | 'WAEC';
  subject?: string;
  year?: number;
  config?: QuizConfig;
}

export function QuizResultsPage() {
  const { navigate } = useNavigation();
  const location = useLocation();
  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    // Get results data from location state
    const data = location.state as QuizResultsData;
    if (!data || !data.questions || data.questions.length === 0) {
      // No data, redirect to home
      navigate('/');
      return;
    }
    setResultsData(data);
  }, [location.state, navigate]);

  if (!resultsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Loading results...</p>
          </div>
        </Card>
      </div>
    );
  }

  const { questions, answers, score, totalQuestions, timeTaken, quizMode, examType, config } = resultsData;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 50;

  // Get consistent mode label
  const modeLabel = config ? QuizConfigHelpers.getModeLabel(config.mode) : quizMode || 'Quiz';

  const correctCount = score;
  const incorrectCount = totalQuestions - score;

  // Performance by topic
  const topicPerformance: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q) => {
    const topic = q.topic || 'Unknown';
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { correct: 0, total: 0 };
    }
    topicPerformance[topic].total++;
    if (answers[q.id] === q.correct) {
      topicPerformance[topic].correct++;
    }
  });

  const currentQuestion = questions[currentReviewIndex];
  const userAnswer = answers[currentQuestion?.id];
  const isCorrect = userAnswer === currentQuestion?.correct;

  const nextQuestion = () => {
    if (currentReviewIndex < questions.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">
        {modeLabel} Results
        {examType && <span className="text-xl ml-2 text-gray-600">({examType})</span>}
      </h1>

      {/* Overall Score Summary */}
      <Card className="mb-6">
        <div className="text-center">
          <div className={`text-5xl md:text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {percentage}%
          </div>
          <div className="text-xl md:text-2xl font-semibold mb-4">
            {passed ? '🎉 Congratulations!' : '📚 Keep Practicing!'}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            {timeTaken && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatTime(timeTaken)}</div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="primary" onClick={() => navigate('/')}>
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
        <Button variant="outline" onClick={() => navigate('/quiz/mode-selection')}>
          <BookOpen className="w-4 h-4 mr-2" />
          New Quiz
        </Button>
        {config && (
          <Button 
            variant="outline" 
            onClick={() => navigate('/quiz/unified', { state: { config } })}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>

      {/* Performance Analytics */}
      {Object.keys(topicPerformance).length > 1 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Performance by Topic</h2>
          <div className="space-y-3">
            {Object.entries(topicPerformance).map(([topic, stats]) => {
              const topicPercentage = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={topic} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{topic}</div>
                    <div className="text-xs text-gray-500">
                      {stats.correct} / {stats.total} correct
                    </div>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 ml-4">
                    <div
                      className={`h-2 rounded-full ${topicPercentage >= 70 ? 'bg-green-500' : topicPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${topicPercentage}%` }}
                    ></div>
                  </div>
                  <div className="ml-3 text-sm font-semibold text-gray-700 w-12 text-right">
                    {topicPercentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Question-by-Question Review */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Review Answers</h2>
          <div className="text-sm text-gray-600">
            Question {currentReviewIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id];
            const isQuestionCorrect = answers[q.id] === q.correct;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentReviewIndex(idx)}
                className={`min-w-[40px] h-10 rounded-lg font-semibold text-sm transition-all ${idx === currentReviewIndex
                    ? 'ring-2 ring-blue-500 scale-110'
                    : ''
                  } ${isQuestionCorrect
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : isAnswered
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Current Question Review */}
        {currentQuestion && (
          <div>
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-3">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <div className={`text-lg font-semibold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                  </div>
                  <p className="text-base md:text-lg text-gray-800">{currentQuestion.text}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                {currentQuestion.exam_type && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {currentQuestion.exam_type}
                  </span>
                )}
                {currentQuestion.exam_year && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {currentQuestion.exam_year}
                  </span>
                )}
                {currentQuestion.topic && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {currentQuestion.topic}
                  </span>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((opt) => {
                const isUserAnswer = userAnswer === opt.key;
                const isCorrectAnswer = currentQuestion.correct === opt.key;

                return (
                  <div
                    key={opt.key}
                    className={`p-3 rounded-lg border-2 ${isCorrectAnswer
                        ? 'border-green-500 bg-green-50'
                        : isUserAnswer && !isCorrect
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">{opt.key}.</span>
                      <span className="flex-1 text-gray-800">{opt.text}</span>
                      {isCorrectAnswer && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {isUserAnswer && !isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    {isUserAnswer && !isCorrect && (
                      <div className="mt-1 text-sm text-red-700 ml-6">Your answer</div>
                    )}
                    {isCorrectAnswer && (
                      <div className="mt-1 text-sm text-green-700 ml-6">Correct answer</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {currentQuestion.explanation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-900 mb-2">Explanation:</div>
                <p className="text-blue-800">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentReviewIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={nextQuestion}
                disabled={currentReviewIndex === questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

