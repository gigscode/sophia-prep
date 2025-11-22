import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../services/quiz-service';
import { questionService, normalizeQuestions } from '../services/question-service';
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

export function PracticeModeQuiz() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { exam_year: typeof exam_year === 'number' ? exam_year : undefined, exam_type: exam_type === 'ALL' ? undefined : (exam_type as any), limit: 50 });
          qs = normalizeQuestions(rows, { exam_year: exam_year as any, exam_type: exam_type as any });
        } else {
          const local = await quizService.getRandomQuestions(10);
          qs = normalizeQuestions(local, { exam_year: 'ALL', exam_type: 'ALL' });
        }
        setQuestions(qs && qs.length > 0 ? qs : []);
      } catch (e) {
        console.error('Failed to load questions:', e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectSel, yearSel, typeSel]);

  const pool = questions;
  const q = pool[index];

  const onSelect = useCallback((key: string) => {
    if (showFeedback || !q) return;
    setSelected(key);
    setShowFeedback(true);
    setAnswers(prev => ({ ...prev, [q.id]: key }));
    if (key === (q.correct || '')) setScore(s => s + 1);
  }, [q, showFeedback]);

  const next = () => {
    setSelected(null);
    setShowFeedback(false);
    if (index < pool.length - 1) {
      setIndex(i => i + 1);
    } else {
      // Quiz completed - navigate to results
      navigate('/quiz-results', {
        state: {
          questions: pool,
          answers,
          score,
          totalQuestions: pool.length,
          quizMode: 'practice',
          subject: subjectSel,
        },
      });
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

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Practice Mode</h1>
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Practice Mode</h1>

      <div className="mb-6">
        <Card>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-gray-600">Subject</label>
            <select className="border rounded px-3 py-2" value={subjectSel || ''} onChange={e => { const v = e.target.value || undefined; setSubjectSel(v); setIndex(0); setSelected(null); setShowFeedback(false); setScore(0); applyParams(v, undefined as any, undefined as any); }}>
              <option value="">Any</option>
              <option value="mathematics">Mathematics</option>
              <option value="english-language">English</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>
            <label className="text-xs text-gray-600">Year</label>
            <select className="border rounded px-3 py-2" value={yearSel === 'ALL' ? 'ALL' : String(yearSel)} onChange={e => { const v = e.target.value; const next = v === 'ALL' ? 'ALL' : Number(v); setYearSel(next as any); setIndex(0); setSelected(null); setShowFeedback(false); applyParams(undefined, next as any, undefined as any); }}>
              <option value="ALL">All</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
            </select>
            <label className="text-xs text-gray-600">Type</label>
            <select className="border rounded px-3 py-2" value={typeSel} onChange={e => { const v = e.target.value as any; setTypeSel(v); setIndex(0); setSelected(null); setShowFeedback(false); applyParams(undefined, undefined as any, v); }}>
              <option value="ALL">All</option>
              <option value="JAMB">JAMB</option>
              <option value="WAEC">WAEC</option>
            </select>
          </div>
        </Card>
      </div>

      {(!q || pool.length === 0) ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No questions available. Please select a subject or try different filters.</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </Card>
      ) : (
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
      )}
    </div>
  );
}