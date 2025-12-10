import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen } from 'lucide-react';

export function QuizModeSelector() {
  const navigate = useNavigate();

  const handleModeSelect = (mode: 'practice' | 'exam') => {
    // Navigate directly to mode selection with preselected mode
    navigate('/quiz/mode-selection', { state: { preselectedMode: mode } });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 text-2xl">
      <h2 className="text-3xl font-bold mb-4">Choose a Quiz Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleModeSelect('practice')}
          className="sophia-card p-4 hover:shadow-md text-left transition-all hover:scale-105"
        >
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold">Practice Mode</h3>
          </div>
          <p className="text-gray-600 text-lg">Immediate feedback after each answer with explanations.</p>
        </button>

        <button
          onClick={() => handleModeSelect('exam')}
          className="sophia-card p-4 hover:shadow-md text-left transition-all hover:scale-105"
        >
          <div className="flex items-center gap-3 mb-1">
            <Clock className="w-6 h-6" style={{ color: '#B78628' }} />
            <h3 className="font-semibold">CBT Quiz Exam</h3>
          </div>
          <p className="text-gray-600 text-lg">Timed exam with results shown at completion.</p>
        </button>
      </div>
    </div>
  );
}