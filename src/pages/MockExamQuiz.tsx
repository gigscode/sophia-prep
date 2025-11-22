import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../services/quiz-service';
import { questionService, normalizeQuestions } from '../services/question-service';
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

export function MockExamQuiz() {
  const navigate = useNavigate();
  const START_TIME = 35 * 60; // seconds
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const params = new URLSearchParams(window.location.search);
  const initialSubject = params.get('subject') || undefined;
  const initialYearParam = params.get('year');
  const initialTypeParam = params.get('type');
  const [subjectSel, setSubjectSel] = useState<string | undefined>(initialSubject);
  const [yearSel, setYearSel] = useState<'ALL' | number>(initialYearParam === 'ALL' ? 'ALL' : (initialYearParam ? Number(initialYearParam) : 'ALL'));
  const [typeSel, setTypeSel] = useState<'ALL' | 'JAMB' | 'WAEC'>(initialTypeParam === 'JAMB' || initialTypeParam === 'WAEC' ? (initialTypeParam as any) : 'ALL');

  const applyParams = (sub?: string | undefined, yr?: 'ALL' | number, typ?: 'ALL' | 'JAMB' | 'WAEC') => {
    const sp = new URLSearchParams();
    const s = sub ?? subjectSel;
    const y = yr ?? yearSel;
    const t = typ ?? typeSel;
    if (s) sp.set('subject', s);
    if (y) sp.set('year', y === 'ALL' ? 'ALL' : String(y));
    if (t) sp.set('type', t);
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const subject = subjectSel;
        const exam_year = yearSel;
        const exam_type = typeSel;
        let qs: any[] = [];
        if (subject) {
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { exam_year: typeof exam_year === 'number' ? exam_year : undefined, exam_type: exam_type === 'ALL' ? undefined : (exam_type as any), limit: 60 });
          qs = normalizeQuestions(rows, { exam_year: exam_year as any, exam_type: exam_type as any });
        } else {
          const local = await quizService.getRandomQuestions(20);
          qs = normalizeQuestions(local, { exam_year: 'ALL', exam_type: 'ALL' });
        }
        setQuestions(qs && qs.length > 0 ? qs : []);
        setIndex(0);
        setAnswers({});
        setCompleted(false);
        setTimeLeft(START_TIME);
      } catch (e) {
        console.error('Failed to load quiz questions:', e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectSel, yearSel, typeSel]);

  useEffect(() => {
    if (completed) return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [completed]);

  useEffect(() => {
    if (timeLeft === 0 && !completed) setCompleted(true);
  }, [timeLeft, completed]);

  // Navigate to results when completed
  useEffect(() => {
    if (completed && pool.length > 0) {
      const timeTaken = START_TIME - timeLeft;
      const calculatedScore = pool.reduce((acc, q) => acc + (answers[q.id] === (q.correct ?? '') ? 1 : 0), 0);

      navigate('/quiz-results', {
        state: {
          questions: pool,
          answers,
          score: calculatedScore,
          totalQuestions: pool.length,
          timeTaken,
          quizMode: 'mock',
          subject: subjectSel,
        },
      });
    }
  }, [completed, pool, answers, navigate, timeLeft, START_TIME, subjectSel]);

  const pool = questions;
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

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Mock Exam</h1>
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exam questions...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!current || pool.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Mock Exam</h1>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No questions available. Please select a subject or try different filters.</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </Card>
      </div>
    );
  }

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
      <div className="mt-4 md:mt-6 flex items-center gap-3 flex-wrap">
        <label className="text-xs text-gray-600">Subject</label>
        <select className="border rounded px-3 py-2" value={subjectSel || ''} onChange={e => { const v = e.target.value || undefined; setSubjectSel(v); applyParams(v, undefined as any, undefined as any); }}>
          <option value="">Any</option>
          <option value="mathematics">Mathematics</option>
          <option value="english-language">English</option>
          <option value="physics">Physics</option>
          <option value="chemistry">Chemistry</option>
          <option value="biology">Biology</option>
        </select>
        <label className="text-xs text-gray-600">Year</label>
        <select className="border rounded px-3 py-2" value={yearSel === 'ALL' ? 'ALL' : String(yearSel)} onChange={e => { const v = e.target.value; const next = v === 'ALL' ? 'ALL' : Number(v); setYearSel(next as any); applyParams(undefined, next as any, undefined as any); }}>
          <option value="ALL">All</option>
          <option value="2019">2019</option>
          <option value="2020">2020</option>
          <option value="2021">2021</option>
          <option value="2022">2022</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
        </select>
        <label className="text-xs text-gray-600">Type</label>
        <select className="border rounded px-3 py-2" value={typeSel} onChange={e => { const v = e.target.value as any; setTypeSel(v); applyParams(undefined, undefined as any, v); }}>
          <option value="ALL">All</option>
          <option value="JAMB">JAMB</option>
          <option value="WAEC">WAEC</option>
        </select>
      </div>
    </div>
  );
}