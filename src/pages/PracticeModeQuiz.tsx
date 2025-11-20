import { useState, useEffect, useCallback } from 'react';
import { quizService } from '../services/quiz-service';
import { questionService } from '../services/question-service';
import { Card } from '../components/ui/Card';
import { OptionButton } from '../components/ui/OptionButton';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

interface QuizQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correct?: string;
  explanation?: string;
}

const sampleQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'What is the capital of Nigeria?',
    options: [
      { key: 'A', text: 'Lagos' },
      { key: 'B', text: 'Abuja' },
      { key: 'C', text: 'Port Harcourt' },
      { key: 'D', text: 'Ibadan' },
    ],
    correct: 'B',
    explanation: 'Abuja is the capital city of Nigeria.',
  },
  {
    id: 'q2',
    text: 'What is 2 + 2?',
    options: [
      { key: 'A', text: '3' },
      { key: 'B', text: '4' },
      { key: 'C', text: '5' },
      { key: 'D', text: '6' },
    ],
    correct: 'B',
    explanation: 'Basic arithmetic: 2 + 2 = 4.',
  },
];

export function PracticeModeQuiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const [questions, setQuestions] = useState<QuizQuestion[]>(sampleQuestions);
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const subject = params.get('subject');
        let qs;
        if (subject) {
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { limit: 30 });
          qs = rows.map((r: any) => ({ id: r.id, text: r.question_text, options: [
            { key: 'A', text: r.option_a },
            { key: 'B', text: r.option_b },
            { key: 'C', text: r.option_c },
            { key: 'D', text: r.option_d },
          ], correct: r.correct_answer, explanation: r.explanation }));
        } else {
          qs = await quizService.getRandomQuestions(10);
        }
        if (qs && qs.length > 0) setQuestions(qs.map((q: any) => ({ id: q.id, text: q.text, options: q.options || [], correct: q.correct, explanation: q.explanation })));
      } catch (e) {
        // ignore, use sample
      }
    })();
  }, []);

  const pool = questions;
  const q = pool[index];

  const onSelect = useCallback((key: string) => {
    if (showFeedback || !q) return;
    setSelected(key);
    setShowFeedback(true);
    if (key === (q.correct || '')) setScore(s => s + 1);
  }, [q, showFeedback]);

  const next = () => {
    setSelected(null);
    setShowFeedback(false);
    if (index < pool.length - 1) {
      setIndex(i => i + 1);
    }
  };

  const isCorrect = !!selected && q && selected === (q.correct || '');

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showFeedback) {
        if (e.key === 'Enter') next();
        return;
      }
      const k = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(k)) onSelect(k);
      if (e.key === 'ArrowRight') setIndex(i => Math.min(pool.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelect, pool.length, showFeedback]);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Practice Mode</h1>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="text-sm text-gray-600">Question <span className="font-semibold">{index + 1}</span> of <span className="font-semibold">{pool.length}</span></div>
          <div className="text-sm text-gray-600">Score: <span className="font-semibold">{score}</span></div>
        </div>

        <ProgressBar value={index + 1} max={pool.length} className="mb-4" />

        <div className="mb-4">
          <div className="text-base md:text-lg font-semibold mb-3">{q.text}</div>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt: any) => (
              <OptionButton key={opt.key} optionKey={opt.key} text={opt.text} selected={selected === opt.key} onSelect={onSelect} disabled={!!showFeedback} />
            ))}
          </div>
        </div>

        {showFeedback && (
          <div className={`mt-6 p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</div>
            <p className="text-gray-700 mt-2">{q.explanation}</p>
            <div className="mt-4">
              <Button variant="primary" onClick={next}>Next Question</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}