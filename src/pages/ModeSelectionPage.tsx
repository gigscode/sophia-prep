import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Calendar, BookMarked } from 'lucide-react';
import type { ExamType, QuizMode, SelectionMethod, QuizConfig } from '../types/quiz-config';
import { QuizConfigHelpers } from '../types/quiz-config';
import { subjectService } from '../services/subject-service';
import { supabase } from '../integrations/supabase/client';
import type { Subject } from '../integrations/supabase/types';

type WizardStep = 'exam-type' | 'mode' | 'method' | 'selection';

interface ModeSelectionState {
  step: WizardStep;
  examType: ExamType | null;
  mode: QuizMode | null;
  selectionMethod: SelectionMethod | null;
  subjectSlug: string | null;
  year: number | null;
}

export function ModeSelectionPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<ModeSelectionState>({
    step: 'exam-type',
    examType: null,
    mode: null,
    selectionMethod: null,
    subjectSlug: null,
    year: null,
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subjects when exam type is selected
  useEffect(() => {
    if (state.examType && state.step === 'selection' && state.selectionMethod === 'subject') {
      loadSubjects();
    }
  }, [state.examType, state.step, state.selectionMethod]);

  // Load available years when exam type is selected
  useEffect(() => {
    if (state.examType && state.step === 'selection' && state.selectionMethod === 'year') {
      loadAvailableYears();
    }
  }, [state.examType, state.step, state.selectionMethod]);

  const loadSubjects = async () => {
    if (!state.examType) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await subjectService.getSubjectsByExamType(state.examType);
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableYears = async () => {
    if (!state.examType) return;
    
    setLoading(true);
    setError(null);
    try {
      // Query distinct exam years for the selected exam type
      const { data, error: queryError } = await supabase
        .from('questions')
        .select('exam_year')
        .eq('exam_type', state.examType)
        .not('exam_year', 'is', null)
        .order('exam_year', { ascending: false });

      if (queryError) throw queryError;

      // Extract unique years
      const years = Array.from(
        new Set((data || []).map((q: any) => q.exam_year).filter((y: any) => y != null))
      ).sort((a, b) => b - a);

      setAvailableYears(years as number[]);
    } catch (err) {
      console.error('Failed to load available years:', err);
      setError('Failed to load available years. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamTypeSelect = (examType: ExamType) => {
    setState({
      step: 'mode',
      examType,
      mode: null,
      selectionMethod: null,
      subjectSlug: null,
      year: null,
    });
  };

  const handleModeSelect = (mode: QuizMode) => {
    setState(prev => ({
      ...prev,
      step: 'method',
      mode,
    }));
  };

  const handleMethodSelect = (method: SelectionMethod) => {
    setState(prev => ({
      ...prev,
      step: 'selection',
      selectionMethod: method,
    }));
  };

  const handleSubjectSelect = (subjectSlug: string) => {
    setState(prev => ({
      ...prev,
      subjectSlug,
    }));
  };

  const handleYearSelect = (year: number) => {
    setState(prev => ({
      ...prev,
      year,
    }));
  };

  const handleBack = () => {
    const stepOrder: WizardStep[] = ['exam-type', 'mode', 'method', 'selection'];
    const currentIndex = stepOrder.indexOf(state.step);
    
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      setState(prev => ({
        ...prev,
        step: previousStep,
      }));
    } else {
      navigate('/');
    }
  };

  const handleStartQuiz = () => {
    if (!state.examType || !state.mode || !state.selectionMethod) {
      setError('Please complete all selections');
      return;
    }

    if (state.selectionMethod === 'subject' && !state.subjectSlug) {
      setError('Please select a subject');
      return;
    }

    if (state.selectionMethod === 'year' && !state.year) {
      setError('Please select a year');
      return;
    }

    const config: QuizConfig = {
      examType: state.examType,
      mode: state.mode,
      selectionMethod: state.selectionMethod,
      subjectSlug: state.subjectSlug || undefined,
      year: state.year || undefined,
    };

    const validationError = QuizConfigHelpers.validateConfig(config);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Navigate to unified quiz with config
    // For now, we'll store in sessionStorage and navigate
    sessionStorage.setItem('quizConfig', JSON.stringify(config));
    navigate('/quiz/unified');
  };

  const canProceed = () => {
    if (state.step === 'selection') {
      if (state.selectionMethod === 'subject') {
        return state.subjectSlug !== null;
      }
      if (state.selectionMethod === 'year') {
        return state.year !== null;
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Start a Quiz</h1>
          <p className="text-gray-600 mt-2">
            {state.step === 'exam-type' && 'Select your exam type'}
            {state.step === 'mode' && 'Choose your quiz mode'}
            {state.step === 'method' && 'How would you like to practice?'}
            {state.step === 'selection' && state.selectionMethod === 'subject' && 'Select a subject'}
            {state.step === 'selection' && state.selectionMethod === 'year' && 'Select an exam year'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['exam-type', 'mode', 'method', 'selection'].map((step, index) => {
              const stepOrder: WizardStep[] = ['exam-type', 'mode', 'method', 'selection'];
              const currentIndex = stepOrder.indexOf(state.step);
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;

              return (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Exam Type Selection */}
          {state.step === 'exam-type' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Select Exam Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExamTypeSelect('JAMB')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BookMarked className="w-8 h-8 text-blue-600" />
                    <h3 className="text-xl font-semibold">JAMB</h3>
                  </div>
                  <p className="text-gray-600">
                    Joint Admissions and Matriculation Board examination
                  </p>
                </button>

                <button
                  onClick={() => handleExamTypeSelect('WAEC')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BookMarked className="w-8 h-8 text-green-600" />
                    <h3 className="text-xl font-semibold">WAEC</h3>
                  </div>
                  <p className="text-gray-600">
                    West African Examinations Council examination
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Mode Selection */}
          {state.step === 'mode' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Choose Quiz Mode</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleModeSelect('practice')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                    <h3 className="text-xl font-semibold">Practice Mode</h3>
                  </div>
                  <p className="text-gray-600">
                    Untimed practice with immediate feedback and explanations
                  </p>
                </button>

                <button
                  onClick={() => handleModeSelect('exam')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <h3 className="text-xl font-semibold">Exam Simulation</h3>
                  </div>
                  <p className="text-gray-600">
                    Timed exam simulation with results shown at completion
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Method Selection */}
          {state.step === 'method' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Select Practice Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleMethodSelect('subject')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-8 h-8 text-purple-600" />
                    <h3 className="text-xl font-semibold">By Subject</h3>
                  </div>
                  <p className="text-gray-600">
                    Practice questions from a specific subject
                  </p>
                </button>

                <button
                  onClick={() => handleMethodSelect('year')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-8 h-8 text-indigo-600" />
                    <h3 className="text-xl font-semibold">By Year</h3>
                  </div>
                  <p className="text-gray-600">
                    Practice questions from a specific past exam year
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Specific Selection */}
          {state.step === 'selection' && state.selectionMethod === 'subject' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Select a Subject</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading subjects...</p>
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No subjects available for {state.examType}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject.slug)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        state.subjectSlug === subject.slug
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="font-semibold text-lg">{subject.name}</h3>
                      {subject.description && (
                        <p className="text-sm text-gray-600 mt-1">{subject.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.step === 'selection' && state.selectionMethod === 'year' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Select Exam Year</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading available years...</p>
                </div>
              ) : availableYears.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No past exam papers available for {state.examType}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        state.year === year
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <span className="font-semibold text-lg">{year}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {state.step === 'selection' && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleStartQuiz}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  canProceed()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Quiz
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Summary Panel */}
        {(state.examType || state.mode || state.selectionMethod) && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Your Selection</h3>
            <div className="space-y-1 text-sm text-blue-800">
              {state.examType && (
                <p>
                  <span className="font-medium">Exam Type:</span> {state.examType}
                </p>
              )}
              {state.mode && (
                <p>
                  <span className="font-medium">Mode:</span>{' '}
                  {QuizConfigHelpers.getModeLabel(state.mode)}
                </p>
              )}
              {state.selectionMethod && (
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  {state.selectionMethod === 'subject' ? 'By Subject' : 'By Year'}
                </p>
              )}
              {state.subjectSlug && (
                <p>
                  <span className="font-medium">Subject:</span>{' '}
                  {subjects.find((s) => s.slug === state.subjectSlug)?.name || state.subjectSlug}
                </p>
              )}
              {state.year && (
                <p>
                  <span className="font-medium">Year:</span> {state.year}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
