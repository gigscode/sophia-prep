import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Calendar } from 'lucide-react';
import type { QuizMode, SelectionMethod, QuizConfig } from '../types/quiz-config';
import { QuizConfigHelpers } from '../types/quiz-config';
import { subjectService } from '../services/subject-service';
import { supabase } from '../integrations/supabase/client';
import type { Subject } from '../integrations/supabase/types';

type WizardStep = 'mode' | 'method' | 'selection';

interface ModeSelectionState {
  step: WizardStep;
  mode: QuizMode | null;
  selectionMethod: SelectionMethod | null;
  subjectSlug: string | null;
  year: number | null;
}

export function ModeSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedMode = (location.state as { preselectedMode?: QuizMode })?.preselectedMode;
  
  const [state, setState] = useState<ModeSelectionState>({
    step: preselectedMode ? 'method' : 'mode',
    mode: preselectedMode || null,
    selectionMethod: null,
    subjectSlug: null,
    year: null,
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await subjectService.getSubjectsByExamType('JAMB');
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
      setError('Failed to load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailableYears = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('questions')
        .select('exam_year')
        .eq('exam_type', 'JAMB')
        .not('exam_year', 'is', null)
        .order('exam_year', { ascending: false });

      if (queryError) throw queryError;

      const years = Array.from(
        new Set((data || []).map((q: { exam_year: number }) => q.exam_year).filter((y: number | null) => y != null))
      ).sort((a, b) => (b as number) - (a as number));

      setAvailableYears(years as number[]);
    } catch (err) {
      console.error('Failed to load available years:', err);
      setError('Failed to load available years. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load subjects and years when reaching selection step
  useEffect(() => {
    if (state.step === 'selection') {
      loadSubjects();
      loadAvailableYears();
    }
  }, [state.step, loadSubjects, loadAvailableYears]);

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
    const stepOrder: WizardStep[] = ['mode', 'method', 'selection'];
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
    if (!state.mode || !state.selectionMethod) {
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

    try {
      const config: QuizConfig = {
        examType: 'JAMB',
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

      sessionStorage.setItem('quizConfig', JSON.stringify(config));
      navigate('/quiz/unified');
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz. Please try again.');
    }
  };

  const canProceed = () => {
    if (state.step === 'selection') {
      if (state.selectionMethod === 'subject') {
        return state.subjectSlug !== null && state.subjectSlug !== '';
      }
      if (state.selectionMethod === 'year') {
        return state.year !== null;
      }
    }
    return false;
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['mode', 'method', 'selection'];
    return steps.indexOf(state.step) + 1;
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
          <h1 className="text-3xl font-bold text-gray-900">JAMB Quiz</h1>
          <p className="text-gray-600 mt-2">
            {state.step === 'mode' && 'Choose your quiz mode'}
            {state.step === 'method' && 'How would you like to practice?'}
            {state.step === 'selection' && state.selectionMethod === 'subject' && 'Select a subject'}
            {state.step === 'selection' && state.selectionMethod === 'year' && 'Select an exam year'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Quiz Mode', 'Practice Method', 'Selection'].map((label, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === getStepNumber();
              const isCompleted = stepNum < getStepNumber();

              return (
                <div key={label} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {stepNum}
                  </div>
                  {index < 2 && (
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
        <main className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Mode Selection */}
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
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
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

          {/* Step 2: Method Selection */}
          {state.step === 'method' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Select Practice Method</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleMethodSelect('subject')}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
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
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
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

          {/* Step 3: Specific Selection */}
          {state.step === 'selection' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">
                {state.selectionMethod === 'subject' ? 'Select Subject' : 'Select Year'}
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading options...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Subject Selection */}
                  {state.selectionMethod === 'subject' && (
                    <div>
                      <label htmlFor="subject-select" className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      {subjects.length === 0 ? (
                        <div className="text-center py-4 text-gray-600 bg-gray-50 rounded-lg">
                          No subjects available
                        </div>
                      ) : (
                        <select
                          id="subject-select"
                          value={state.subjectSlug || ''}
                          onChange={(e) => handleSubjectSelect(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200"
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.slug}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Optional Year Filter */}
                      {state.subjectSlug && (
                        <div className="mt-4">
                          <label htmlFor="year-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                            Filter by Year (Optional)
                          </label>
                          <select
                            id="year-filter"
                            value={state.year || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setState(prev => ({ ...prev, year: val ? Number(val) : null }));
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200"
                          >
                            <option value="">All Years</option>
                            {availableYears.map((year) => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Year Selection */}
                  {state.selectionMethod === 'year' && (
                    <div>
                      <label htmlFor="year-select" className="block text-sm font-semibold text-gray-700 mb-2">
                        Exam Year <span className="text-red-500">*</span>
                      </label>
                      {availableYears.length === 0 ? (
                        <div className="text-center py-4 text-gray-600 bg-gray-50 rounded-lg">
                          No past exam papers available
                        </div>
                      ) : (
                        <select
                          id="year-select"
                          value={state.year || ''}
                          onChange={(e) => handleYearSelect(Number(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200"
                        >
                          <option value="">Select a year</option>
                          {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      )}

                      {/* Optional Subject Filter */}
                      {state.year && subjects.length > 0 && (
                        <div className="mt-4">
                          <label htmlFor="subject-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                            Filter by Subject (Optional)
                          </label>
                          <select
                            id="subject-filter"
                            value={state.subjectSlug || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setState(prev => ({ ...prev, subjectSlug: val || null }));
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200"
                          >
                            <option value="">All Subjects</option>
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.slug}>
                                {subject.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Start Quiz Button */}
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
        </main>

        {/* Summary Panel */}
        {(state.mode || state.selectionMethod) && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Your Selection</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p><span className="font-medium">Exam:</span> JAMB</p>
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