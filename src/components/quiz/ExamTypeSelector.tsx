import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Users } from 'lucide-react';
import { examTypeService } from '../../services/exam-type-service';
import type { ExamTypeRecord } from '../../types/database';

interface ExamTypeSelectorProps {
  onExamTypeSelected: (examType: ExamTypeRecord) => void;
  selectedExamType?: ExamTypeRecord | null;
}

export function ExamTypeSelector({ onExamTypeSelected, selectedExamType }: ExamTypeSelectorProps) {
  const [examTypes, setExamTypes] = useState<ExamTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExamTypes();
  }, []);

  const loadExamTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await examTypeService.getAllExamTypes();
      setExamTypes(types);
    } catch (err) {
      console.error('Failed to load exam types:', err);
      setError('Failed to load exam types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getExamTypeIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case 'jamb':
        return <GraduationCap className="w-8 h-8 text-blue-600" />;
      case 'waec':
        return <BookOpen className="w-8 h-8 text-green-600" />;
      case 'neco':
        return <Users className="w-8 h-8 text-purple-600" />;
      default:
        return <GraduationCap className="w-8 h-8 text-gray-600" />;
    }
  };

  const getExamTypeColor = (slug: string) => {
    switch (slug.toLowerCase()) {
      case 'jamb':
        return {
          bg: 'bg-blue-100',
          ring: 'ring-blue-500',
          text: 'text-blue-600'
        };
      case 'waec':
        return {
          bg: 'bg-green-100',
          ring: 'ring-green-500',
          text: 'text-green-600'
        };
      case 'neco':
        return {
          bg: 'bg-purple-100',
          ring: 'ring-purple-500',
          text: 'text-purple-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          ring: 'ring-gray-500',
          text: 'text-gray-600'
        };
    }
  };

  const getExamTypeDescription = (slug: string, description?: string) => {
    if (description) return description;
    
    switch (slug.toLowerCase()) {
      case 'jamb':
        return 'Unified Tertiary Matriculation Examination - University entrance exam requiring exactly 4 subjects';
      case 'waec':
        return 'West African Senior School Certificate Examination - Secondary school leaving exam with flexible subject selection (6-9 subjects)';
      case 'neco':
        return 'National Examinations Council - Alternative secondary school certificate examination';
      default:
        return 'Select this examination type to continue';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-lg">{error}</p>
          </div>
          <button
            onClick={loadExamTypes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-3xl font-bold mb-4">Select Exam Type</h2>
      <p className="text-gray-600 text-base mb-6">
        Choose the examination you're preparing for to access the appropriate quiz modes and subject validation
      </p>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Available Exam Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examTypes.map((examType) => {
            const colors = getExamTypeColor(examType.slug);
            const isSelected = selectedExamType?.id === examType.id;
            
            return (
              <button
                key={examType.id}
                onClick={() => onExamTypeSelected(examType)}
                className={`
                  sophia-card p-6 hover:shadow-md text-left transition-all hover:scale-105
                  ${isSelected ? `ring-2 ${colors.ring}` : ''}
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 ${colors.bg} rounded-lg`}>
                    {getExamTypeIcon(examType.slug)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{examType.name}</h4>
                    <p className="text-sm text-gray-500">{examType.full_name || examType.slug.toUpperCase()}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  {getExamTypeDescription(examType.slug, examType.description)}
                </p>
                {examType.duration_minutes && (
                  <div className="mt-2 text-xs text-gray-500">
                    Duration: {Math.floor(examType.duration_minutes / 60)}h {examType.duration_minutes % 60}m
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {examTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No exam types available at the moment.</p>
          <button
            onClick={loadExamTypes}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}

      {selectedExamType && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedExamType.name} ({selectedExamType.full_name})
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Next, you'll select your quiz mode (Practice or CBT Exam) and configure your subjects.
          </p>
        </div>
      )}
    </div>
  );
}