import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import type { ExamType } from '../../types/quiz-config';

export function QuizModeSelector() {
  const navigate = useNavigate();
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null);

  const handleExamTypeSelect = (examType: ExamType) => {
    setSelectedExamType(examType);
    // Navigate to class category selection
    navigate('/quiz/class-category', { state: { examType } });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-3xl font-bold mb-4">CBT Exam Simulation</h2>
      <p className="text-gray-600 text-base mb-6">
        Take a full computer-based test simulating real JAMB/WAEC exam conditions
      </p>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Select Exam Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleExamTypeSelect('JAMB')}
            className={`
              sophia-card p-6 hover:shadow-md text-left transition-all hover:scale-105
              ${selectedExamType === 'JAMB' ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold">JAMB</h4>
                <p className="text-sm text-gray-500">UTME Exam</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-3">
              Unified Tertiary Matriculation Examination - 4 subjects, 2.5 hours
            </p>
          </button>

          <button
            onClick={() => handleExamTypeSelect('WAEC')}
            className={`
              sophia-card p-6 hover:shadow-md text-left transition-all hover:scale-105
              ${selectedExamType === 'WAEC' ? 'ring-2 ring-green-500' : ''}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold">WAEC</h4>
                <p className="text-sm text-gray-500">SSCE Exam</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-3">
              West African Senior School Certificate Examination - 9 subjects, 3 hours
            </p>
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After selecting your exam type, you'll choose your class category
          (Science, Arts, or Commercial) to start your CBT exam simulation.
        </p>
      </div>
    </div>
  );
}