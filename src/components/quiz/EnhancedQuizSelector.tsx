import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Target, ArrowLeft } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import type { Subject } from '../../integrations/supabase/types';

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

interface EnhancedQuizSelectorProps {
  onSelectionComplete: (selection: QuizSelectionData) => void;
  onCancel: () => void;
  initialMode?: 'practice' | 'exam';
}

type SelectionStep = 'mode' | 'subject' | 'topic' | 'year';

export function EnhancedQuizSelector({ 
  onSelectionComplete, 
  onCancel, 
  initialMode 
}: EnhancedQuizSelectorProps) {
  const [currentStep, setCurrentStep] = useState<SelectionStep>(initialMode ? 'subject' : 'mode');
  const [selection, setSelection] = useState<QuizSelectionData>({
    mode: initialMode || 'practice'
  });
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load topics when subject is selected
  useEffect(() => {
    if (selection.subject) {
      loadTopics(selection.subject.id);
    }
  }, [selection.subject]);

  // Load years when subject is selected (for exam mode)
  useEffect(() => {
    if (selection.subject && selection.mode === 'exam') {
      loadAvailableYears(selection.subject.id);
    }
  }, [selection.subject, selection.mode]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .eq('exam_type', 'JAMB')
        .order('sort_order');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
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
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableYears = async (subjectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('exam_year')
        .eq('subject_id', subjectId)
        .eq('exam_type', 'JAMB')
        .not('exam_year', 'is', null)
        .order('exam_year', { ascending: false });

      if (error) throw error;
      
      const years = [...new Set((data || []).map((q: { exam_year: number | null }) => q.exam_year).filter(Boolean))] as number[];
      setAvailableYears(years);
    } catch (error) {
      console.error('Error loading available years:', error);
      setAvailableYears([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode: 'practice' | 'exam') => {
    setSelection(prev => ({ ...prev, mode }));
    setCurrentStep('subject');
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelection(prev => ({ ...prev, subject }));
    
    // For practice mode, go to topic selection
    // For exam mode, go to year selection
    if (selection.mode === 'practice') {
      setCurrentStep('topic');
    } else {
      setCurrentStep('year');
    }
  };

  const handleTopicSelect = (topic: Topic | null) => {
    setSelection(prev => ({ ...prev, topic: topic || undefined }));
    
    // Complete selection for practice mode
    onSelectionComplete({
      ...selection,
      topic: topic || undefined
    });
  };

  const handleYearSelect = (year: number | null) => {
    const finalSelection = {
      ...selection,
      year: year || undefined
    };
    
    onSelectionComplete(finalSelection);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'subject':
        if (initialMode) {
          onCancel();
        } else {
          setCurrentStep('mode');
        }
        break;
      case 'topic':
        setCurrentStep('subject');
        break;
      case 'year':
        setCurrentStep('subject');
        break;
      default:
        onCancel();
    }
  };

  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Quiz Mode</h2>
        <p className="text-gray-600">Select how you want to practice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleModeSelect('practice')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h3 className="text-xl font-semibold">Practice Mode</h3>
          </div>
          <p className="text-gray-600 mb-3">
            Study by subject and topic with immediate feedback
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Choose specific subjects and topics</li>
            <li>• See explanations immediately</li>
            <li>• No time pressure</li>
          </ul>
        </button>

        <button
          onClick={() => handleModeSelect('exam')}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-8 h-8 text-green-600" />
            <h3 className="text-xl font-semibold">Exam Mode</h3>
          </div>
          <p className="text-gray-600 mb-3">
            Take timed exams by year with real exam conditions
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Past questions by year</li>
            <li>• Timed like real JAMB</li>
            <li>• Full exam simulation</li>
          </ul>
        </button>
      </div>
    </div>
  );

  const renderSubjectSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Subject</h2>
          <p className="text-gray-600">
            Select a subject for {selection.mode === 'practice' ? 'practice' : 'exam simulation'}
          </p>
        </div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading subjects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelect(subject)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{subject.name}</h3>
              </div>
              {subject.description && (
                <p className="text-sm text-gray-600">{subject.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderTopicSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Topic</h2>
          <p className="text-gray-600">
            Select a topic in <span className="font-medium">{selection.subject?.name}</span> or practice all topics
          </p>
        </div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading topics...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* All Topics Option */}
          <button
            onClick={() => handleTopicSelect(null)}
            className="w-full p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">All Topics</h3>
                <p className="text-sm text-blue-700">Practice questions from all topics in this subject</p>
              </div>
            </div>
          </button>

          {/* Individual Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{topic.name}</h3>
                <p className="text-sm text-gray-600">Focus on this specific topic</p>
              </button>
            ))}
          </div>

          {topics.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No topics available for this subject.</p>
              <button
                onClick={() => handleTopicSelect(null)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue with All Questions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderYearSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Choose Exam Year</h2>
          <p className="text-gray-600">
            Select a specific year for <span className="font-medium">{selection.subject?.name}</span> or practice all years
          </p>
        </div>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading available years...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* All Years Option */}
          <button
            onClick={() => handleYearSelect(null)}
            className="w-full p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:border-green-500 hover:bg-green-100 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">All Years</h3>
                <p className="text-sm text-green-700">Practice questions from all available years</p>
              </div>
            </div>
          </button>

          {/* Individual Years */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center"
              >
                <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">{year}</h3>
                <p className="text-sm text-gray-600">JAMB {year}</p>
              </button>
            ))}
          </div>

          {availableYears.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No past questions available for this subject.</p>
              <button
                onClick={() => handleYearSelect(null)}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {currentStep === 'mode' && renderModeSelection()}
      {currentStep === 'subject' && renderSubjectSelection()}
      {currentStep === 'topic' && renderTopicSelection()}
      {currentStep === 'year' && renderYearSelection()}
    </div>
  );
}