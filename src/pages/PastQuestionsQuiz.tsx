import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService, normalizeQuestions } from '../services/question-service';

interface PastQuestion {
  id: string;
  exam_year: number;
  question_number: number;
  text: string;
  options: { key: 'A'|'B'|'C'|'D'; text: string }[];
  correct: 'A'|'B'|'C'|'D';
}

export function PastQuestionsQuiz() {
  const navigate = useNavigate();
  const [year, setYear] = useState<number | 'ALL'>('ALL');
  const [subject, setSubject] = useState<string>('mathematics');
  const [typeSel, setTypeSel] = useState<'ALL' | 'JAMB' | 'WAEC'>('ALL');
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<PastQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<'A'|'B'|'C'|'D'|null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('subject') || subject;
        const y = params.get('year');
        const t = params.get('type');
        const ey = y === 'ALL' ? 'ALL' : (y ? Number(y) : year);
        const et = t === 'ALL' ? 'ALL' : (t === 'JAMB' || t === 'WAEC' ? t : typeSel);
        const rows = await questionService.getQuestionsBySubjectSlug(slug, { exam_year: typeof ey === 'number' ? ey : undefined, exam_type: et === 'ALL' ? undefined : (et as any), limit: 60 });
        const normalized = normalizeQuestions(rows, { exam_year: ey as any, exam_type: et as any });
        const mapped: PastQuestion[] = (normalized || []).map(r => ({
          id: r.id,
          exam_year: (r as any).exam_year || 0,
          question_number: 0,
          text: r.text,
          options: r.options as any,
          correct: (r.correct as any) || 'A',
        }));
        setLoaded(mapped);
      } catch (e) {
        console.error('Failed to load past questions:', e);
        setLoaded([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [subject, year, typeSel]);

  const pool = loaded;
  const questions = useMemo(() => {
    const filtered = year === 'ALL' ? pool : pool.filter(q => q.exam_year === year);
    return filtered;
  }, [year, pool]);

  const q = questions[index];

  const handleSelect = (key: 'A'|'B'|'C'|'D') => {
    setSelected(key);
    setAnswers(prev => ({ ...prev, [q.id]: key }));
  };

  const next = () => {
    setSelected(null);
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
    } else {
      // Quiz completed - navigate to results
      const score = Object.entries(answers).reduce((acc, [qId, ans]) => {
        const question = questions.find(q => q.id === qId);
        return acc + (question && ans === question.correct ? 1 : 0);
      }, 0);

      navigate('/quiz-results', {
        state: {
          questions: questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correct: q.correct,
            exam_year: q.exam_year,
          })),
          answers,
          score,
          totalQuestions: questions.length,
          quizMode: 'past',
          subject,
        },
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Past Questions</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading past questions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!q || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Past Questions</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No past questions available for the selected filters.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Reload</button>
          </div>
        </div>
      </div>
    );
  }

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
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
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
          <label className="text-sm text-gray-700 ml-4">Type:</label>
          <select
            value={typeSel}
            onChange={(e) => {
              setIndex(0);
              setSelected(null);
              setTypeSel(e.target.value as any);
            }}
            className="border rounded px-3 py-2"
          >
            <option value="ALL">All</option>
            <option value="JAMB">JAMB</option>
            <option value="WAEC">WAEC</option>
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
                  onClick={() => handleSelect(opt.key)}
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