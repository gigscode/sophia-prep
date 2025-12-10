import { QuizModeSelector } from '../components/quiz/QuizModeSelector';

export function QuizModeSelectorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">CBT Exam</h1>
      <QuizModeSelector />
    </div>
  );
}