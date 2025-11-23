import { Link } from 'react-router-dom';
import { Clock, BookOpen, Eye } from 'lucide-react';

export function QuizModeSelector() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Choose a Quiz Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/practice" className="sophia-card p-4 hover:shadow-md">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold">Practice Mode</h3>
          </div>
          <p className="text-gray-600 text-sm">Immediate feedback after each answer with explanations.</p>
        </Link>

        <Link to="/mock-exams" className="sophia-card p-4 hover:shadow-md">
          <div className="flex items-center gap-3 mb-1">
            <Clock className="w-6 h-6 text-yellow-600" />
            <h3 className="font-semibold">Mock Exam</h3>
          </div>
          <p className="text-gray-600 text-sm">Timed exam with results shown at completion.</p>
        </Link>

        <Link to="/reader" className="sophia-card p-4 hover:shadow-md">
          <div className="flex items-center gap-3 mb-1">
            <Eye className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold">Reader Mode</h3>
          </div>
          <p className="text-gray-600 text-sm">See the correct answer immediately after selecting.</p>
        </Link>
      </div>
    </div>
  );
}