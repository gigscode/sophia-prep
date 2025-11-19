import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { quizService } from '../services/quiz-service';

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
  const [selected, setSelected] = useState<'A'|'B'|'C'|'D'|null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const [questions, setQuestions] = useState(sampleQuestions);
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const subject = params.get('subject');
        let qs;
        if (subject) {
          qs = await quizService.getQuestionsForSubject(subject);
        } else {
          qs = await quizService.getRandomQuestions(10);
        }
        if (qs && qs.length > 0) setQuestions(qs.map(q => ({ id: q.id, text: q.text, options: q.options, correct: q.correct, explanation: q.explanation })));
      } catch (e) {
        // ignore, use sample
      }
    })();
  }, []);

  const q = questions[index];

  const onSelect = (key: 'A'|'B'|'C'|'D') => {
    if (showFeedback) return;
    setSelected(key);
    setShowFeedback(true);
    if (key === q.correct) setScore(s => s + 1);
  };

  const next = () => {
    setSelected(null);
    setShowFeedback(false);
    if (index < sampleQuestions.length - 1) {
      setIndex(i => i + 1);
    }
  };

  const isCorrect = selected && selected === q.correct;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Practice Mode</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between mb-4">
          <div>Question {index + 1} / {sampleQuestions.length}</div>
          <div>Score: {score}</div>
        </div>
        <p className="text-lg mb-4">{q.text}</p>
        <div className="grid grid-cols-1 gap-3">
          {q.options.map(opt => (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className={`text-left p-4 border rounded hover:bg-blue-50 ${selected === opt.key ? 'border-blue-600' : 'border-gray-300'}`}
            >
              <span className="font-semibold mr-2">{opt.key}.</span>
              {opt.text}
            </button>
          ))}
        </div>
        {showFeedback && (
          <div className="mt-6 p-4 rounded border" style={{borderColor: isCorrect ? '#22c55e' : '#ef4444'}}>
            <div className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </div>
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