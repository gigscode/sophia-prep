import { useEffect, useMemo, useState } from 'react';

interface QuizQuestion {
  id: string;
  text: string;
  options: { key: 'A'|'B'|'C'|'D'; text: string }[];
  correct: 'A'|'B'|'C'|'D';
}

const sampleQuestions: QuizQuestion[] = new Array(20).fill(null).map((_, i) => ({
  id: `q${i+1}`,
  text: `Sample question #${i+1}`,
  options: [
    { key: 'A', text: 'Option A' },
    { key: 'B', text: 'Option B' },
    { key: 'C', text: 'Option C' },
    { key: 'D', text: 'Option D' },
  ],
  correct: 'A',
}));

export function MockExamQuiz() {
  // 35 minutes in seconds
  const START_TIME = 35 * 60;
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A'|'B'|'C'|'D'>>({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [completed]);

  useEffect(() => {
    if (timeLeft === 0 && !completed) {
      setCompleted(true);
    }
  }, [timeLeft, completed]);

  const current = sampleQuestions[index];

  const score = useMemo(() => {
    if (!completed) return 0;
    return sampleQuestions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
  }, [completed, answers]);

  const select = (key: 'A'|'B'|'C'|'D') => {
    if (completed) return;
    setAnswers(a => ({ ...a, [current.id]: key }));
  };

  const next = () => setIndex(i => Math.min(sampleQuestions.length - 1, i + 1));
  const prev = () => setIndex(i => Math.max(0, i - 1));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Mock Exam (Single Subject)</h1>

      {!completed ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between mb-4">
            <div>Question {index + 1} / {sampleQuestions.length}</div>
            <div className="font-mono">Time Left: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
          </div>
          <p className="text-lg mb-4">{current.text}</p>
          <div className="grid grid-cols-1 gap-3">
            {current.options.map(opt => (
              <button
                key={opt.key}
                onClick={() => select(opt.key)}
                className={`text-left p-4 border rounded ${answers[current.id] === opt.key ? 'border-blue-600' : 'border-gray-300'}`}
              >
                <span className="font-semibold mr-2">{opt.key}.</span>
                {opt.text}
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={prev} className="px-4 py-2 border rounded">Previous</button>
            <button onClick={next} className="px-4 py-2 border rounded">Next</button>
            <button onClick={() => setCompleted(true)} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Exam Completed</h2>
          <p className="mb-4">Score: {score} / {sampleQuestions.length}</p>
          <div className="space-y-2">
            {sampleQuestions.map(q => (
              <div key={q.id} className="p-3 border rounded">
                <div className="font-semibold">{q.text}</div>
                <div>Your answer: {answers[q.id] ?? '—'}</div>
                <div>Correct answer: {q.correct}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}