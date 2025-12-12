import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { ExamTypeSelector } from './ExamTypeSelector';
import { UniversalQuizModeSelector } from './UniversalQuizModeSelector';
import { useUniversalQuizConfigContext, ConfigurationStepUtils } from '../../contexts/UniversalQuizConfigContext';
import type { ExamTypeRecord, QuizMode } from '../../types/database';
import type { UniversalQuizModeConfig } from './UniversalQuizModeSelector';

/**
 * Universal Quiz Configuration Flow Component
 * Orchestrates the complete quiz configuration process
 */
export function UniversalQuizConfigurationFlow() {
  const {
    config,
    setExamType,
    setQuizMode,
    goToPreviousStep,
    validateConfiguration,
    getConfigurationSummary
  } = useUniversalQuizConfigContext();

  const handleExamTypeSelected = (examType: ExamTypeRecord) => {
    setExamType(examType);
  };

  const handleModeSelected = (mode: QuizMode, modeConfig: UniversalQuizModeConfig) => {
    setQuizMode(mode, modeConfig);
  };

  const handleGoBack = () => {
    goToPreviousStep();
  };

  const renderProgressIndicator = () => {
    const steps = [
      'exam-type-selection',
      'mode-selection',
      'subject-selection',
      'configuration',
      'ready'
    ] as const;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = ConfigurationStepUtils.isStepCompleted(config.currentStep, step);
            const isCurrent = config.currentStep === step;
            const stepName = ConfigurationStepUtils.getStepName(step);

            return (
              <div key={step} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 
                    'bg-gray-100 border-gray-300 text-gray-500'}
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {stepName}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-4 transition-colors
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${ConfigurationStepUtils.getStepProgress(config.currentStep)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (config.currentStep) {
      case 'exam-type-selection':
        return (
          <ExamTypeSelector
            onExamTypeSelected={handleExamTypeSelected}
            selectedExamType={config.examType}
          />
        );

      case 'mode-selection':
        return (
          <UniversalQuizModeSelector
            examType={config.examType!}
            onModeSelected={handleModeSelected}
            selectedMode={config.mode}
          />
        );

      case 'subject-selection':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-3xl font-bold mb-4">Select Subjects</h2>
            <p className="text-gray-600 mb-6">
              Subject selection component will be implemented in the next task.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <strong>Next:</strong> You'll select subjects based on your {config.examType?.name} exam requirements.
              </p>
            </div>
          </div>
        );

      case 'configuration':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-3xl font-bold mb-4">Configure Quiz</h2>
            <p className="text-gray-600 mb-6">
              Quiz configuration component will be implemented in the next task.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                <strong>Next:</strong> You'll configure question count, exam year (for CBT), and other settings.
              </p>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Quiz</h2>
            <p className="text-gray-600 mb-6">
              Your quiz configuration is complete and ready to start.
            </p>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                <strong>Configuration Complete!</strong> You can now start your quiz.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
    const canGoBack = ConfigurationStepUtils.getPreviousStep(config.currentStep) !== null;
    const validation = validateConfiguration();

    return (
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handleGoBack}
          disabled={!canGoBack}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${canGoBack 
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Step {ConfigurationStepUtils.getStepProgress(config.currentStep) / 20} of 5
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!validation.isValid && validation.errors.length > 0 && (
            <div className="text-sm text-red-600 mr-4">
              {validation.errors[0]}
            </div>
          )}
          <button
            disabled={!validation.isValid}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${validation.isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderConfigurationSummary = () => {
    if (config.currentStep === 'exam-type-selection') return null;

    const summary = getConfigurationSummary();

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Configuration Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Exam Type:</span>
            <p className="font-medium">{summary.examTypeName}</p>
          </div>
          {config.mode && (
            <div>
              <span className="text-gray-600">Mode:</span>
              <p className="font-medium">{summary.modeName}</p>
            </div>
          )}
          {summary.subjectCount > 0 && (
            <div>
              <span className="text-gray-600">Subjects:</span>
              <p className="font-medium">{summary.subjectCount} selected</p>
            </div>
          )}
          <div>
            <span className="text-gray-600">Questions:</span>
            <p className="font-medium">{summary.questionCount}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderProgressIndicator()}
      {renderConfigurationSummary()}
      {renderCurrentStep()}
      {renderNavigationButtons()}
    </div>
  );
}