import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RotateCcw, BookOpen, Target, CheckCircle, XCircle } from 'lucide-react';
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

type ViewState = 'subject-selection' | 'topic-selection' | 'quiz' | 'results';

export function PracticeModePage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewState>('subject-selection');
  
  // Selection state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (subjectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setTopics(data || []);
    } catch (err) {
      console.error('Error loading topics:', err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = async (subject: Subject) => {
    setSelectedSubject(subject);
    await loadTopics(subject.id);
    setCurrentView('topic-selection');
  };

  const handleTopicSelect = async (topic: Topic | null) => {
    setSelectedTopic(topic);
    await loadQuestions(selectedSubject!.id, topic?.id);
  };

  const loadQuestions = async (subjectId: string, topicId?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .limit(20);

      if (topicId) {
        query = query.eq('topic_id', topicId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('No questions found for this selection');
        return;
      }

      // Shuffle questions
      const shuffled = data.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setShowExplanation(false);
      setStartTime(Date.now());
      setCurrentView('quiz');
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    if (answers[questionId]) return; // Already answered
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentView('results');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setShowExplanation(!!answers[questions[currentQuestionIndex - 1]?.id]);
      setCurrentQuestionIndex(prev => prev - 1);
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
      scorePercentage,
      timeTaken
    };
  };

  const handleRestart = () => {
    setCurrentView('subject-selection');
    setSelectedSubject(null);
    setSelectedTopic(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowExplanation(false);
    setError(null);
  };

  const goBack = () => {
    switch (currentView) {
      case 'topic-selection':
        setCurrentView('subject-selection');
        setSelectedSubject(null);
        break;
      case 'quiz':
        setCurrentView('topic-selection');
        setQuestions([]);
        setAnswers({});
        break;
      case 'results':
        handleRestart();
        break;
      default:
        navigate('/');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Subject Selection View
  if (currentView === 'subject-selection') {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Practice Mode"
          description="Choose a subject to practice"
          showBackButton
          onBack={() => navigate('/')}
        />
        
        <div className="container mx-auto px-4 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading subjects...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectSelect(subject)}
                  className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{subject.name}</h3>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Topic Selection View
  if (currentView === 'topic-selection') {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title={selectedSubject?.name || 'Select Topic'}
          description="Choose a topic or practice all"
          showBackButton
          onBack={goBack}
        />
        
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading topics...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* All Topics Option */}
              <button
                onClick={() => handleTopicSelect(null)}
                className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">All Topics</h3>
                    <p className="text-sm text-blue-700">Practice questions from all topics</p>
                  </div>
                </div>
              </button>

              {/* Individual Topics */}
              {topics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic)}
                      className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Focus on this topic</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 py-4">No specific topics available</p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => handleTopicSelect(null)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Try loading all questions
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz View
  if (currentView === 'quiz' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    const isCorrect = currentAnswer === currentQuestion.correct_answer;
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Exit</span>
              </button>
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {currentQuestionIndex + 1} / {questions.length}
                </p>
                <p className="text-xs text-gray-500">{selectedSubject?.name}</p>
              </div>

              <div className="text-sm text-gray-600">
                {Object.keys(answers).filter(id => answers[id] === questions.find(q => q.id === id)?.correct_answer).length} correct
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h2>
            
            <div className="space-y-3">
              {[
                { key: 'A', text: currentQuestion.option_a },
                { key: 'B', text: currentQuestion.option_b },
                { key: 'C', text: currentQuestion.option_c },
                { key: 'D', text: currentQuestion.option_d }
              ].map((option) => {
                const isSelected = currentAnswer === option.key;
                const isCorrectOption = option.key === currentQuestion.correct_answer;
                const showResult = showExplanation && currentAnswer;
                
                let buttonClass = 'border-gray-200 hover:border-gray-300';
                if (showResult) {
                  if (isCorrectOption) {
                    buttonClass = 'border-green-500 bg-green-50';
                  } else if (isSelected && !isCorrectOption) {
                    buttonClass = 'border-red-500 bg-red-50';
                  }
                } else if (isSelected) {
                  buttonClass = 'border-blue-500 bg-blue-50';
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option.key)}
                    disabled={!!currentAnswer}
                    className={`w-full p-4 text-left border-2 rounded-xl transition-all ${buttonClass} ${currentAnswer ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        showResult && isCorrectOption ? 'bg-green-500 text-white' :
                        showResult && isSelected && !isCorrectOption ? 'bg-red-500 text-white' :
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {showResult && isCorrectOption ? <CheckCircle className="w-5 h-5" /> :
                         showResult && isSelected && !isCorrectOption ? <XCircle className="w-5 h-5" /> :
                         option.key}
                      </span>
                      <span className="text-gray-900 pt-1">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && currentQuestion.explanation && (
              <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-sm font-medium mb-2 ${isCorrect ? 'text-green-800' : 'text-amber-800'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={!currentAnswer}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results View
  if (currentView === 'results') {
    const results = calculateResults();

    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Practice Complete"
          description="Your performance summary"
        />
        
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Score Circle */}
            <div className="text-center mb-8">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                results.scorePercentage >= 70 ? 'bg-green-100' : 
                results.scorePercentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                <span className={`text-3xl font-bold ${
                  results.scorePercentage >= 70 ? 'text-green-600' : 
                  results.scorePercentage >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {results.scorePercentage}%
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {results.scorePercentage >= 70 ? 'Great Job!' : 
                 results.scorePercentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
              </h2>
              <p className="text-gray-600">
                {selectedSubject?.name}
                {selectedTopic && ` • ${selectedTopic.name}`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{results.totalQuestions}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{results.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{results.incorrectAnswers}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{formatTime(results.timeTaken)}</div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Practice Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}