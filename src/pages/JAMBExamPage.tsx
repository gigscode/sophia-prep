import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';

import { supabase } from '../integrations/supabase/client';
import type { Subject } from '../integrations/supabase/types';
import { Select } from '../components/ui/Select';
import { subscriptionService, SUBSCRIPTION_PLANS, FORCED_LIMITS } from '../services/subscription-service';
import { useAuth } from '../hooks/useAuth';

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
  subject_id: string;
  subject_name?: string;
}

type ViewState = 'subject-selection' | 'exam' | 'results';

export function JAMBExamPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewState>('subject-selection');

  // Subject selection state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [englishSubject, setEnglishSubject] = useState<Subject | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Exam state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(150 * 60); // 2.5 hours in seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>(SUBSCRIPTION_PLANS.FREE);
  const { user } = useAuth();

  // Timer effect
  useEffect(() => {
    if (currentView === 'exam' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentView, timeRemaining]);

  // Load subjects, years and user plan on mount
  useEffect(() => {
    loadSubjects();
    loadAvailableYears();
    loadUserPlan();
  }, [user]);

  const loadUserPlan = async () => {
    if (!user) return;
    const plan = await subscriptionService.getActivePlan();
    setUserPlan(plan);
  };

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const subjectsData = data || [];
      setSubjects(subjectsData);

      // Find English Language subject and auto-select it (only English Language is mandatory for all JAMB students)
      const english = subjectsData.find((s: Subject) =>
        s.slug === 'english'
      ) as Subject | undefined;

      if (english) {
        setEnglishSubject(english);
        setSelectedSubjects([english.id]);
      }
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableYears = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_year')
        .eq('exam_type', 'JAMB')
        .not('exam_year', 'is', null)
        .order('exam_year', { ascending: false });

      if (error) throw error;

      // Get unique years and sort them
      const years = [...new Set((data || []).map((item: { exam_year: number | null }) => item.exam_year))]
        .filter((year): year is number => year !== null)
        .sort((a, b) => b - a); // Most recent first

      setAvailableYears(years);
    } catch (err) {
      console.error('Error loading available years:', err);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    // Don't allow deselecting English Language
    if (englishSubject && subjectId === englishSubject.id) return;

    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        // Don't allow more than 4 subjects total (English + 3 others)
        if (prev.length >= 4) return prev;
        return [...prev, subjectId];
      }
    });
  };

  const canStartExam = () => {
    return selectedSubjects.length === 4; // English + 3 others
  };

  const handleStartExam = async () => {
    if (!canStartExam()) {
      setError('Please select exactly 3 subjects in addition to English Language');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Questions per subject: 45 for Premium, 20 for Free
      const questionsPerSubject = userPlan === SUBSCRIPTION_PLANS.PREMIUM
        ? FORCED_LIMITS.PREMIUM_QUESTIONS_PER_SUBJECT
        : FORCED_LIMITS.FREE_QUESTIONS_PER_SUBJECT;

      const allQuestions: QuizQuestion[] = [];

      for (const subjectId of selectedSubjects) {
        let query = supabase
          .from('questions')
          .select(`
            *,
            subjects!inner(name)
          `)
          .eq('subject_id', subjectId)
          .eq('is_active', true);

        // Add year filter if specific year is selected
        if (selectedYear !== 'all') {
          query = query.eq('exam_year', selectedYear);
        }

        const { data, error } = await query.limit(questionsPerSubject);

        if (error) throw error;

        const subjectQuestions = (data || []).map((q: Record<string, unknown>) => ({
          ...q,
          subject_name: (q.subjects as { name?: string })?.name || 'Unknown Subject'
        })) as QuizQuestion[];

        // Shuffle questions for this subject
        const shuffled = subjectQuestions.sort(() => Math.random() - 0.5);
        allQuestions.push(...shuffled.slice(0, questionsPerSubject));
      }

      if (allQuestions.length === 0) {
        const yearText = selectedYear === 'all' ? 'any year' : `year ${selectedYear}`;
        setError(`No questions found for selected subjects from ${yearText}. Try selecting a different year or different subjects.`);
        return;
      }

      // Final shuffle of all questions
      const finalQuestions = allQuestions.sort(() => Math.random() - 0.5);

      setQuestions(finalQuestions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeRemaining(150 * 60); // Reset timer to 2.5 hours
      setStartTime(Date.now());
      setCurrentView('exam');
    } catch (err) {
      console.error('Error loading exam questions:', err);
      setError('Failed to load exam questions');
    } finally {
      setLoading(false);
    }
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
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAutoSubmit = () => {
    setCurrentView('results');
  };

  const handleManualSubmit = () => {
    if (window.confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
      setCurrentView('results');
    }
  };

  const calculateResults = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // Calculate subject-wise results
    const subjectResults = selectedSubjects.map(subjectId => {
      const subject = subjects.find(s => s.id === subjectId);
      const subjectQuestions = questions.filter(q => q.subject_id === subjectId);
      const subjectCorrect = subjectQuestions.filter(q => answers[q.id] === q.correct_answer).length;
      const subjectAnswered = subjectQuestions.filter(q => answers[q.id]).length;

      return {
        name: subject?.name || 'Unknown',
        total: subjectQuestions.length,
        answered: subjectAnswered,
        correct: subjectCorrect,
        percentage: subjectQuestions.length > 0 ? Math.round((subjectCorrect / subjectQuestions.length) * 100) : 0
      };
    });

    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers: answeredQuestions - correctAnswers,
      unanswered: totalQuestions - answeredQuestions,
      scorePercentage,
      timeTaken,
      subjectResults
    };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining < 300) return 'text-red-600 bg-red-100'; // Last 5 minutes
    if (timeRemaining < 1800) return 'text-orange-600 bg-orange-100'; // Last 30 minutes
    return 'text-blue-600 bg-blue-100';
  };

  // Subject Selection View
  if (currentView === 'subject-selection') {
    const otherSubjects = subjects.filter(s => s.id !== englishSubject?.id);
    const selectedOthers = selectedSubjects.filter(id => id !== englishSubject?.id);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
          <div className="container mx-auto px-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-blue-200 hover:text-white mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
            <h1 className="text-3xl font-bold mb-2">JAMB CBT Exam</h1>
            <p className="text-blue-100">Select your exam subjects</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Year Selection */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-900">Select JAMB Year</h2>
              <div className="w-48">
                <Select
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  options={[
                    { value: 'all', label: 'All Years' },
                    ...availableYears.map(year => ({
                      value: year.toString(),
                      label: year.toString()
                    }))
                  ]}
                />
              </div>
            </div>
            <p className="text-sm text-green-700">
              {selectedYear === 'all'
                ? 'Questions from all available years will be included in your exam'
                : `Only questions from ${selectedYear} will be included in your exam`
              }
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">JAMB Exam Instructions</h2>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>English Language is mandatory and already selected</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Select exactly 3 additional subjects</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Exam duration: 2 hours 30 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>No explanations during exam - results shown at the end</span>
              </li>
            </ul>
          </div>

          {userPlan === SUBSCRIPTION_PLANS.FREE && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-orange-900 mb-1">Free Tier Limit</h2>
                  <p className="text-orange-800">
                    You are currently on the Free plan. Each subject is limited to <strong>20 questions</strong> (80 total).
                    Upgrade to Premium to get the full <strong>45 questions</strong> per subject (180 total).
                  </p>
                  <button
                    onClick={() => navigate('/subscriptions')}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* English Language (Mandatory) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Mandatory Subject</h3>
            {englishSubject && (
              <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900">{englishSubject.name}</h4>
                    <p className="text-sm text-green-700">Required for all JAMB candidates</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Other Subjects - Grouped by Category */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Select 3 Additional Subjects ({selectedOthers.length}/3)
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading subjects...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Science Subjects */}
                {(() => {
                  const scienceSubjects = otherSubjects.filter(s =>
                    s.subject_category === 'SCIENCE' ||
                    (s.subject_category === 'GENERAL' && s.name === 'Mathematics')
                  );
                  if (scienceSubjects.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Science Subjects
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {scienceSubjects.map((subject) => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const canSelect = selectedOthers.length < 3 || isSelected;

                          return (
                            <button
                              key={subject.id}
                              onClick={() => handleSubjectToggle(subject.id)}
                              disabled={!canSelect}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected
                                  ? 'border-green-500 bg-green-50'
                                  : canSelect
                                    ? 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {isSelected && <CheckCircle className="w-5 h-5 text-green-600" />}
                                <h5 className={`font-medium ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                  {subject.name}
                                </h5>
                              </div>
                              {subject.description && (
                                <p className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                                  {subject.description}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Commercial Subjects */}
                {(() => {
                  const commercialSubjects = otherSubjects.filter(s => s.subject_category === 'COMMERCIAL');
                  if (commercialSubjects.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Commercial Subjects
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {commercialSubjects.map((subject) => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const canSelect = selectedOthers.length < 3 || isSelected;

                          return (
                            <button
                              key={subject.id}
                              onClick={() => handleSubjectToggle(subject.id)}
                              disabled={!canSelect}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : canSelect
                                    ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                <h5 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {subject.name}
                                </h5>
                              </div>
                              {subject.description && (
                                <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                  {subject.description}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Arts Subjects */}
                {(() => {
                  const artsSubjects = otherSubjects.filter(s => s.subject_category === 'ARTS');
                  if (artsSubjects.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        Arts Subjects
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {artsSubjects.map((subject) => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const canSelect = selectedOthers.length < 3 || isSelected;

                          return (
                            <button
                              key={subject.id}
                              onClick={() => handleSubjectToggle(subject.id)}
                              disabled={!canSelect}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected
                                  ? 'border-purple-500 bg-purple-50'
                                  : canSelect
                                    ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {isSelected && <CheckCircle className="w-5 h-5 text-purple-600" />}
                                <h5 className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                                  {subject.name}
                                </h5>
                              </div>
                              {subject.description && (
                                <p className={`text-sm ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                                  {subject.description}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Language Subjects */}
                {(() => {
                  const languageSubjects = otherSubjects.filter(s => s.subject_category === 'LANGUAGE');
                  if (languageSubjects.length === 0) return null;

                  return (
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        Language Subjects
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {languageSubjects.map((subject) => {
                          const isSelected = selectedSubjects.includes(subject.id);
                          const canSelect = selectedOthers.length < 3 || isSelected;

                          return (
                            <button
                              key={subject.id}
                              onClick={() => handleSubjectToggle(subject.id)}
                              disabled={!canSelect}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected
                                  ? 'border-orange-500 bg-orange-50'
                                  : canSelect
                                    ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {isSelected && <CheckCircle className="w-5 h-5 text-orange-600" />}
                                <h5 className={`font-medium ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>
                                  {subject.name}
                                </h5>
                              </div>
                              {subject.description && (
                                <p className={`text-sm ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>
                                  {subject.description}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}


              </div>
            )}
          </div>

          {/* Start Exam Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStartExam}
              disabled={!canStartExam() || loading}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${canStartExam() && !loading
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <Play className="w-6 h-6" />
              {loading ? 'Loading Exam...' : 'Start JAMB Exam'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exam View
  if (currentView === 'exam' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Fixed Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">Question {currentQuestionIndex + 1}</span>
                  <span className="text-gray-500"> of {questions.length}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Answered: {answeredCount}/{questions.length}
                </div>
                {selectedYear !== 'all' && (
                  <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {selectedYear}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getTimeColor()}`}>
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(timeRemaining)}
                </div>
                <button
                  onClick={handleManualSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Submit Exam
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Subject Badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {currentQuestion.subject_name}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {[
                { key: 'A', text: currentQuestion.option_a },
                { key: 'B', text: currentQuestion.option_b },
                { key: 'C', text: currentQuestion.option_c },
                { key: 'D', text: currentQuestion.option_d }
              ].map((option) => {
                const isSelected = answers[currentQuestion.id] === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option.key)}
                    className={`w-full p-4 text-left border-2 rounded-xl transition-all ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {option.key}
                      </span>
                      <span className="text-gray-900 pt-1">{option.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
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
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
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
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">JAMB Exam Results</h1>
            <p className="text-blue-100">Your performance summary</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Overall Score */}
            <div className="text-center mb-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 ${results.scorePercentage >= 70 ? 'bg-green-100' :
                  results.scorePercentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                <span className={`text-4xl font-bold ${results.scorePercentage >= 70 ? 'text-green-600' :
                    results.scorePercentage >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                  {results.scorePercentage}%
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {results.scorePercentage >= 70 ? 'Excellent Performance!' :
                  results.scorePercentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
              </h2>
              <p className="text-gray-600">JAMB CBT Exam Simulation</p>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{results.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
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
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>

            {/* Subject-wise Results */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
              <div className="space-y-3">
                {results.subjectResults.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{subject.name}</h4>
                      <p className="text-sm text-gray-600">
                        {subject.correct}/{subject.total} correct ({subject.answered} answered)
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${subject.percentage >= 70 ? 'text-green-600' :
                        subject.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                      {subject.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCurrentView('subject-selection');
                  setSelectedSubjects(englishSubject ? [englishSubject.id] : []);
                  setSelectedYear('all');
                  setQuestions([]);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setError(null);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                Take Another Exam
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