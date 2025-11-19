import { useState } from 'react';

interface QuizQuestion {
  id: string;
  text: string;
  options: { key: 'A'|'B'|'C'|'D'; text: string }[];
  correct: 'A'|'B'|'C'|'D';
  explanation: string;
}

const sampleQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'Which gas do plants absorb during photosynthesis?',
    options: [
      { key: 'A', text: 'Oxygen' },
      { key: 'B', text: 'Nitrogen' },
      { key: 'C', text: 'Carbon Dioxide' },
      { key: 'D', text: 'Hydrogen' },
    ],
    correct: 'C',
    explanation: 'Plants absorb carbon dioxide and release oxygen during photosynthesis.',
  },
];

export function ReaderModeQuiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<'A'|'B'|'C'|'D'|null>(null);
  const q = sampleQuestions[index];

  const select = (key: 'A'|'B'|'C'|'D') => setSelected(key);
  const next = () => {
    setSelected(null);
    setIndex(i => Math.min(sampleQuestions.length - 1, i + 1));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Reader Mode</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between mb-4">
          <div>Question {index + 1} / {sampleQuestions.length}</div>
        </div>
        <p className="text-lg mb-4">{q.text}</p>
        <div className="grid grid-cols-1 gap-3">
          {q.options.map(opt => (
            <button
              key={opt.key}
              onClick={() => select(opt.key)}
              className={`text-left p-4 border rounded ${selected === opt.key ? 'border-blue-600' : 'border-gray-300'}`}
            >
              <span className="font-semibold mr-2">{opt.key}.</span>
              {opt.text}
            </button>
          ))}
        </div>
        {selected && (
          <div className="mt-6 p-4 rounded border border-green-600">
            <div className="font-semibold text-green-600">Correct answer: {q.correct}</div>
            <p className="text-gray-700 mt-2">{q.explanation}</p>
            <button
              onClick={next}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}