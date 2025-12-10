import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import type { Subject, ExamType } from '../../integrations/supabase/types';

interface YearSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  examType: ExamType;
  mode: 'practice' | 'exam';
  onYearSelect: (year: number | 'ALL') => void;
}

export function YearSelectionModal({
  isOpen,
  onClose,
  subject,
  examType,
  mode,
  onYearSelect
}: YearSelectionModalProps) {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAvailableYears();
    }
  }, [isOpen, subject, examType]);

  const loadAvailableYears = async () => {
    setLoading(true);
    try {
      // Query distinct exam years for the selected subject and exam type
      const { data, error } = await supabase
        .from('questions')
        .select('exam_year')
        .eq('exam_type', examType)
        .eq('subject_id', subject.id)
        .not('exam_year', 'is', null)
        .order('exam_year', { ascending: false });

      if (error) throw error;

      // Extract unique years
      const uniqueYears = Array.from(
        new Set((data || []).map((q: { exam_year: number }) => q.exam_year).filter((y: number | null) => y != null))
      ).sort((a, b) => (b as number) - (a as number));

      setYears(uniqueYears as number[]);
    } catch (err) {
      console.error('Failed to load available years:', err);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modeLabel = mode === 'practice' ? 'Practice' : 'Quiz';
  const modeColor = mode === 'practice' ? 'blue' : 'green';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Year</h2>
            <p className="text-sm text-gray-600 mt-1">
              {subject.name} - {examType} {modeLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Choose a specific year or practice all available questions
          </p>

          {/* All Years Option */}
          <button
            onClick={() => onYearSelect('ALL')}
            className={`w-full p-4 border-2 border-${modeColor}-600 bg-${modeColor}-50 rounded-lg hover:bg-${modeColor}-100 transition-all text-left`}
            style={{
              borderColor: mode === 'practice' ? '#2563EB' : '#16A34A',
              backgroundColor: mode === 'practice' ? '#EFF6FF' : '#F0FDF4'
            }}
          >
            <div className="flex items-center gap-3">
              <Calendar size={24} className={`text-${modeColor}-600`} style={{ color: mode === 'practice' ? '#2563EB' : '#16A34A' }} />
              <div>
                <div className="font-semibold text-gray-900">All Years</div>
                <div className="text-sm" style={{ color: mode === 'practice' ? '#1E40AF' : '#15803D' }}>
                  Practice all available questions
                </div>
              </div>
            </div>
          </button>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading years...</p>
            </div>
          )}

          {/* Specific Years */}
          {!loading && years.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => onYearSelect(year)}
                  className="p-4 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <div className="font-semibold text-gray-900">{year}</div>
                  <div className="text-xs text-gray-500">{examType}</div>
                </button>
              ))}
            </div>
          )}

          {/* No Years Available */}
          {!loading && years.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No questions available for {subject.name} ({examType})</p>
              <p className="text-sm mt-2">Try selecting "All Years" or a different exam type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

