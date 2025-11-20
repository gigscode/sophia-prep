import { useEffect, useMemo, useState, useCallback } from 'react';
import { quizService } from '../services/quiz-service';
import { questionService } from '../services/question-service';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { OptionButton } from '../components/ui/OptionButton';
import { Button } from '../components/ui/Button';

interface QuizQuestion {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correct?: string;
}

const sampleQuestions: QuizQuestion[] = new Array(20).fill(null).map((_, i) => ({
  id: `q${i + 1}`,
  text: `Sample question #${i + 1}`,
  options: [
    { key: 'A', text: 'Option A' },
    { key: 'B', text: 'Option B' },
    { key: 'C', text: 'Option C' },
    { key: 'D', text: 'Option D' },
  ],
}));

export function MockExamQuiz() {
  const START_TIME = 35 * 60; // seconds
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const subject = params.get('subject');
        let qs: any;
        if (subject) {
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { limit: 50 });
          qs = rows.map((r: any) => ({ id: r.id, text: r.question_text, options: [
            { key: 'A', text: r.option_a },
            { key: 'B', text: r.option_b },
            { key: 'C', text: r.option_c },
            { key: 'D', text: r.option_d },
          ], correct: r.correct_answer }));
        } else {
          qs = await quizService.getRandomQuestions(20);
        }
        setQuestions(qs.map((q: any) => ({ id: q.id, text: q.text, options: q.options || [], correct: q.correct })));
      } catch (e) {
        console.error('Failed to load quiz questions:', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [completed]);

  useEffect(() => {
    if (timeLeft === 0 && !completed) setCompleted(true);
  }, [timeLeft, completed]);

  const pool = questions.length > 0 ? questions : sampleQuestions;
  const current = pool[index];

  const score = useMemo(() => {
    if (!completed) return 0;
    return pool.reduce((acc, q) => acc + (answers[q.id] === (q.correct ?? '') ? 1 : 0), 0);
  }, [completed, answers, pool]);

  const select = useCallback((key: string) => {
    if (completed) return;
    setAnswers(a => ({ ...a, [current.id]: key }));
  }, [completed, current]);

  const next = () => setIndex(i => Math.min(pool.length - 1, i + 1));
  const prev = () => setIndex(i => Math.max(0, i - 1));

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      const k = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(k)) select(k);
      if (e.key === 'Enter') setCompleted(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [completed, select]);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Mock Exam</h1>

      {!completed ? (
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="text-sm text-gray-600">Question <span className="font-semibold">{index + 1}</span> of <span className="font-semibold">{pool.length}</span></div>
            <div className="text-sm md:text-base font-mono text-gray-700">Time: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
          </div>

          <ProgressBar value={index + 1} max={pool.length} className="mb-5" />

          <div className="mb-4">
            <div className="text-base md:text-lg font-semibold mb-3">{current.text}</div>
            <div className="grid grid-cols-1 gap-3">
              {current.options.map((opt: any) => (
                <OptionButton key={opt.key} optionKey={opt.key} text={opt.text} selected={answers[current.id] === opt.key} onSelect={select} />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Button variant="ghost" onClick={prev} className="px-3">Previous</Button>
            <Button variant="ghost" onClick={next}>Next</Button>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-sm text-gray-500">Selected: <span className="font-semibold">{answers[current.id] ?? '—'}</span></div>
              <Button variant="primary" onClick={() => setCompleted(true)}>Submit Exam</Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="text-2xl font-bold mb-2">Exam Completed</h2>
          <p className="mb-4">Score: <span className="font-semibold">{score}</span> / <span className="font-semibold">{pool.length}</span></p>
          <div className="space-y-3">
            {pool.map((q: any) => (
              <div key={q.id} className="p-3 border rounded-lg">
                <div className="font-medium mb-1">{q.text}</div>
                <div className="text-sm text-gray-600">Your answer: <span className="font-semibold">{answers[q.id] ?? '—'}</span> • Correct: <span className="font-semibold">{q.correct ?? '—'}</span></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}