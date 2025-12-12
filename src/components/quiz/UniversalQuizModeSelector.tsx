import { useState } from 'react';
import { Clock, BookOpen, Timer, CheckCircle } from 'lucide-react';
import type { ExamTypeRecord, QuizMode } from '../../types/database';

interface UniversalQuizModeSelectorProps {
  examType: ExamTypeRecord;
  onModeSelected: (mode: QuizMode, config: UniversalQuizModeConfig) => void;
  selectedMode?: QuizMode | null;
}

export interface UniversalQuizModeConfig {
  mode: QuizMode;
  examType: ExamTypeRecord;
  hasTimer: boolean;
  showImmediateExplanations: boolean;
  autoSubmitOnTimeout: boolean;
  description: string;
  features: string[];
}

export function UniversalQuizModeSelector({ 
  examType, 
  onModeSelected, 
  selectedMode 
}: UniversalQuizModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<QuizMode | null>(null);

  const getModeConfig = (mode: QuizMode): UniversalQuizModeConfig => {
    const baseConfig = {
      mode,
      examType,
    };

    if (mode === 'PRACTICE') {
      return {
        ...baseConfig,
        hasTimer: false,
        showImmediateExplanations: true,
        autoSubmitOnTimeout: false,
        description: `Practice mode for ${examType.name} with unlimited time and immediate explanations`,
        features: [
          'Unlimited time per question',
          'Immediate explanations after each answer',
          'Custom question count (5-100)',
          'Perfect for learning and understanding concepts',
          'No pressure - focus on comprehension'
        ]
      };
    } else {
      return {
        ...baseConfig,
        hasTimer: true,
        showImmediateExplanations: false,
        autoSubmitOnTimeout: true,
        description: `CBT exam simulation for ${examType.name} with real exam conditions`,
        features: [
          '1-minute timer per question',
          'Explanations shown after quiz completion',
          'Question count selection (5-180)',
          'Exam year selection (2020-2024)',
          'Auto-advance when timer expires',
          'Simulates real exam pressure'
        ]
      };
    }
  };

  const handleModeSelect = (mode: QuizMode) => {
    const config = getModeConfig(mode);
    onModeSelected(mode, config);
  };

  const practiceConfig = getModeConfig('PRACTICE');
  const cbtConfig = getModeConfig('CBT_EXAM');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-3xl font-bold mb-4">Select Quiz Mode</h2>
      <p className="text-gray-600 text-base mb-6">
        Choose your preferred quiz experience for {examType.name} ({examType.full_name || examType.slug.toUpperCase()})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Practice Mode */}
        <button
          onClick={() => handleModeSelect('PRACTICE')}
          onMouseEnter={() => setHoveredMode('PRACTICE')}
          onMouseLeave={() => setHoveredMode(null)}
          className={`
            sophia-card p-6 hover:shadow-lg text-left transition-all hover:scale-105
            ${selectedMode === 'PRACTICE' ? 'ring-2 ring-green-500 bg-green-50' : ''}
            ${hoveredMode === 'PRACTICE' ? 'shadow-lg' : ''}
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-700">Practice Mode</h3>
              <p className="text-sm text-green-600">Learn at your own pace</p>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            {practiceConfig.description}
          </p>

          <div className="space-y-2">
            {practiceConfig.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">No Time Pressure</span>
            </div>
          </div>
        </button>

        {/* CBT Exam Mode */}
        <button
          onClick={() => handleModeSelect('CBT_EXAM')}
          onMouseEnter={() => setHoveredMode('CBT_EXAM')}
          onMouseLeave={() => setHoveredMode(null)}
          className={`
            sophia-card p-6 hover:shadow-lg text-left transition-all hover:scale-105
            ${selectedMode === 'CBT_EXAM' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            ${hoveredMode === 'CBT_EXAM' ? 'shadow-lg' : ''}
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Timer className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-700">CBT Exam Mode</h3>
              <p className="text-sm text-blue-600">Real exam simulation</p>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            {cbtConfig.description}
          </p>

          <div className="space-y-2">
            {cbtConfig.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">1 Minute Per Question</span>
            </div>
          </div>
        </button>
      </div>

      {/* Mode Comparison */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Mode Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Feature</span>
          </div>
          <div className="text-center">
            <span className="font-medium text-green-700">Practice Mode</span>
          </div>
          <div className="text-center">
            <span className="font-medium text-blue-700">CBT Exam Mode</span>
          </div>
          
          <div className="text-gray-600">Timer</div>
          <div className="text-center text-green-600">No timer</div>
          <div className="text-center text-blue-600">1 min/question</div>
          
          <div className="text-gray-600">Explanations</div>
          <div className="text-center text-green-600">Immediate</div>
          <div className="text-center text-blue-600">After completion</div>
          
          <div className="text-gray-600">Question Count</div>
          <div className="text-center text-green-600">5-100</div>
          <div className="text-center text-blue-600">5-180</div>
          
          <div className="text-gray-600">Exam Year</div>
          <div className="text-center text-green-600">Not required</div>
          <div className="text-center text-blue-600">Required (2020-2024)</div>
        </div>
      </div>

      {selectedMode && (
        <div className={`
          p-4 rounded-lg border
          ${selectedMode === 'PRACTICE' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}
        `}>
          <p className={`text-sm ${selectedMode === 'PRACTICE' ? 'text-green-800' : 'text-blue-800'}`}>
            <strong>Selected:</strong> {selectedMode === 'PRACTICE' ? 'Practice Mode' : 'CBT Exam Mode'} for {examType.name}
          </p>
          <p className={`text-sm mt-1 ${selectedMode === 'PRACTICE' ? 'text-green-700' : 'text-blue-700'}`}>
            Next, you'll select your subjects and configure your quiz settings.
          </p>
        </div>
      )}
    </div>
  );
}