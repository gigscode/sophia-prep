import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { EnhancedQuizSelector } from '../components/quiz/EnhancedQuizSelector';
import { PageHeader } from '../components/layout';
import { supabase } from '../integrations/supabase/client';
import type { Subject } from '../integrations/supabase/types';

interface Topic {
  id: string;
  name: string;
  slug: string;
  subject_id: string;
  is_active: boolean;
  order_index: number;
}

interface QuizSelectionData {
  subject?: Subject;
  topic?: Topic;
  year?: number;
  mode: 'practice' | 'exam';
}

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  exam_year?: number;
}

export function OptimizedQuizPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'selection' | 'quiz' | 'results'>('selection');
  const [quizSelection, setQuizSelection] = useState<QuizSelectionData | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Timer effect for exam mode
  useEffect(() => {
    if (currentView === 'quiz' && quizSelection?.mode === 'exam' && timeRemaining !== null) {
      if (timeRemaining <= 0) {
        handleQuizComplete();
        return;
      }

      const timer = setInterval(() => {
        setTimeRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentView, quizSelection?.mode, timeRemaining]);

  const handleSelectionComplete = async (selection: QuizSelectionData) => {
    setQuizSelection(selection);
    setLoading(true);
    setError(null);

    try {
      await loadQuestions(selection);
      setCurrentView('quiz');
      setStartTime(Date.now());
      
      // Set timer for exam mode (45 minutes per subject for JAMB)
      if (selection.mode === 'exam') {
        setTimeRemaining(45 * 60); // 45 minutes in seconds
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (selection: QuizSelectionData) => {
    if (!selection.subject) {
      throw new Error('No subject selected');
    }

    let query = supabase
      .from('questions')
      .select('*')
      .eq('subject_id', selection.subject.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Add topic filter if specific topic selected
    if (selection.topic) {
      query = query.eq('topic_id', selection.topic.id);
    }

    // Add year filter if specific year selected
    if (selection.year) {
      query = query.eq('exam_year', selection.year);
    }

    // Add exam type filter
    query = query.eq('exam_type', 'JAMB');

    // Limit questions based on mode
    const limit = selection.mode === 'practice' ? 20 : 40;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No questions found for the selected criteria');
    }

    // Shuffle questions for variety
    const shuffledQuestions = data.sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuizComplete = () => {
    setCurrentView('results');
    if (timeRemaining !== null) {
      setTimeRemaining(null);
    }
  };

  const calculateResults = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers: answeredQuestions - correctAnswers,
      unanswered: totalQuestions - answeredQuestions,
      scorePercentage,
      timeTaken
    };
  };

  const handleRestart = () => {
    setCurrentView('selection');
    setQuizSelection(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(null);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (currentView === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="JAMB Quiz Practice"
          description="Practice with past questions by subject, topic, and year"
          showBackButton
          onBack={() => navigate('/dashboard')}
        />
        
        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading questions...</p>
            </div>
          ) : (
            <EnhancedQuizSelector
              onSelectionComplete={handleSelectionComplete}
              onCancel={() => navigate('/dashboard')}
            />
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'quiz' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Selection
                </button>
                <div className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {timeRemaining !== null && (
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Time: {formatTime(timeRemaining)}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {quizSelection?.subject?.name}
                  {quizSelection?.topic && ` • ${quizSelection.topic.name}`}
                  {quizSelection?.year && ` • ${quizSelection.year}`}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.question_text}
                </h2>
                
                <div className="space-y-3">
                  {[
                    { key: 'A', text: currentQuestion.option_a },
                    { key: 'B', text: currentQuestion.option_b },
                    { key: 'C', text: currentQuestion.option_c },
                    { key: 'D', text: currentQuestion.option_d }
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option.key)}
                      className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                        answers[currentQuestion.id] === option.key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-700 mr-3">{option.key}.</span>
                      <span className="text-gray-900">{option.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="text-sm text-gray-600">
                  Answered: {Object.keys(answers).length} / {questions.length}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                  {currentQuestionIndex < questions.length - 1 && <ArrowLeft className="w-4 h-4 rotate-180" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'results') {
    const results = calculateResults();

    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Quiz Results"
          description="Your performance summary"
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">{results.scorePercentage}%</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                <p className="text-gray-600">
                  {quizSelection?.subject?.name}
                  {quizSelection?.topic && ` • ${quizSelection.topic.name}`}
                  {quizSelection?.year && ` • ${quizSelection.year}`}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{results.incorrectAnswers}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{formatTime(results.timeTaken)}</div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Take Another Quiz
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}