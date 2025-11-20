import { useEffect, useMemo, useState } from 'react';
import { questionService } from '../services/question-service';

interface PastQuestion {
  id: string;
  exam_year: number;
  question_number: number;
  text: string;
  options: { key: 'A'|'B'|'C'|'D'; text: string }[];
  correct: 'A'|'B'|'C'|'D';
}

const sample: PastQuestion[] = [
  {
    id: 'pq-2019-1',
    exam_year: 2019,
    question_number: 1,
    text: '2019 sample past question?',
    options: [
      { key: 'A', text: 'Option A' },
      { key: 'B', text: 'Option B' },
      { key: 'C', text: 'Option C' },
      { key: 'D', text: 'Option D' },
    ],
    correct: 'A',
  },
  {
    id: 'pq-2020-1',
    exam_year: 2020,
    question_number: 1,
    text: '2020 sample past question?',
    options: [
      { key: 'A', text: 'Option A' },
      { key: 'B', text: 'Option B' },
      { key: 'C', text: 'Option C' },
      { key: 'D', text: 'Option D' },
    ],
    correct: 'B',
  },
];

export function PastQuestionsQuiz() {
  const [year, setYear] = useState<number | 'ALL'>('ALL');
  const [subject, setSubject] = useState<string>('mathematics');
  const [loaded, setLoaded] = useState<PastQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<'A'|'B'|'C'|'D'|null>(null);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('subject') || subject;
      const y = params.get('year');
      const t = params.get('type');
      const ey = y ? Number(y) : undefined;
      const et = t === 'JAMB' || t === 'WAEC' ? t : undefined;
      const rows = await questionService.getQuestionsBySubjectSlug(slug, { exam_year: ey, exam_type: et, limit: 50 });
      const mapped: PastQuestion[] = (rows || []).map(r => ({
        id: r.id,
        exam_year: r.exam_year || 0,
        question_number: r.question_number || 0,
        text: r.question_text,
        options: [
          { key: 'A', text: r.option_a },
          { key: 'B', text: r.option_b },
          { key: 'C', text: r.option_c },
          { key: 'D', text: r.option_d },
        ],
        correct: r.correct_answer,
      }));
      setLoaded(mapped);
    })();
  }, [subject]);

  const pool = loaded.length > 0 ? loaded : sample;
  const questions = useMemo(() => {
    const filtered = year === 'ALL' ? pool : pool.filter(q => q.exam_year === year);
    return filtered;
  }, [year, pool]);

  const q = questions[index];

  const next = () => {
    setSelected(null);
    setIndex(i => Math.min(questions.length - 1, i + 1));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Past Questions</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-700">Filter by year:</label>
          <select
            value={year === 'ALL' ? 'ALL' : String(year)}
            onChange={(e) => {
              const v = e.target.value;
              setIndex(0);
              setSelected(null);
              setYear(v === 'ALL' ? 'ALL' : Number(v));
            }}
            className="border rounded px-3 py-2"
          >
            <option value="ALL">All</option>
            <option value="2019">2019</option>
            <option value="2020">2020</option>
          </select>
          <label className="text-sm text-gray-700 ml-4">Subject:</label>
          <select
            value={subject}
            onChange={(e) => {
              setIndex(0);
              setSelected(null);
              setSubject(e.target.value);
            }}
            className="border rounded px-3 py-2"
          >
            <option value="mathematics">Mathematics</option>
            <option value="english-language">English</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
          </select>
        </div>
        {q ? (
          <>
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <div>Year: {q.exam_year}</div>
              <div>Question #: {q.question_number}</div>
            </div>
            <p className="text-lg mb-4">{q.text}</p>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelected(opt.key)}
                  className={`text-left p-4 border rounded ${selected === opt.key ? 'border-blue-600' : 'border-gray-300'}`}
                >
                  <span className="font-semibold mr-2">{opt.key}.</span>
                  {opt.text}
                </button>
              ))}
            </div>
            <button
              onClick={next}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          </>
        ) : (
          <div className="text-gray-600">No questions for selected year.</div>
        )}
      </div>
    </div>
  );
}