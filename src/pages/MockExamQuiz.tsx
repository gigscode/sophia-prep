import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { quizService } from '../services/quiz-service';
import { questionService, normalizeQuestions } from '../services/question-service';
import { subjectService } from '../services/subject-service';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { OptionButton } from '../components/ui/OptionButton';
import { Button } from '../components/ui/Button';
import type { Subject } from '../integrations/supabase/types';

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
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const initialSubject = params.get('subject') || undefined;
  const initialYearParam = params.get('year');
  const initialTypeParam = params.get('type');
  const [subjectSel, setSubjectSel] = useState<string | undefined>(initialSubject);
  const [yearSel, setYearSel] = useState<'ALL' | number>(initialYearParam === 'ALL' ? 'ALL' : (initialYearParam ? Number(initialYearParam) : 'ALL'));
  const [typeSel, setTypeSel] = useState<'ALL' | 'JAMB' | 'WAEC'>(initialTypeParam === 'JAMB' || initialTypeParam === 'WAEC' ? (initialTypeParam as any) : 'ALL');
  const [showSelectionPage, setShowSelectionPage] = useState(!initialSubject);

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

  // Load subjects when exam type is selected
  useEffect(() => {
    if (typeSel !== 'ALL') {
      (async () => {
        setLoadingSubjects(true);
        try {
          const subjects = await subjectService.getSubjectsByExamType(typeSel);
          setAvailableSubjects(subjects);
        } catch (e) {
          console.error('Failed to load subjects:', e);
          setAvailableSubjects([]);
        } finally {
          setLoadingSubjects(false);
        }
      })();
    }
  }, [typeSel]);

  useEffect(() => {
    (async () => {
      // Don't load questions if type is not selected yet
      if (typeSel === 'ALL') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const subject = subjectSel;
        const exam_year = yearSel;
        const exam_type = typeSel as 'JAMB' | 'WAEC'; // At this point, exam_type is 'JAMB' | 'WAEC', never 'ALL' (guarded by check above)
        let qs: any[] = [];
        if (subject) {
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { exam_year: typeof exam_year === 'number' ? exam_year : undefined, exam_type: exam_type, limit: 60 });
          qs = normalizeQuestions(rows, { exam_year: exam_year as any, exam_type: exam_type });
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

  const pool = questions;
  const current = pool[index];

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

  // Exam Type Selection Screen
  if (typeSel === 'ALL') {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Select Exam Type</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <button
            onClick={() => {
              setTypeSel('WAEC');
              applyParams(undefined, undefined, 'WAEC');
            }}
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-green-500 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">WAEC</h2>
            </div>
            <p className="text-gray-600 text-lg">
              Practice with past questions and mock exams specifically designed for the West African Senior School Certificate Examination.
            </p>
          </button>

          <button
            onClick={() => {
              setTypeSel('JAMB');
              applyParams(undefined, undefined, 'JAMB');
            }}
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">JAMB</h2>
            </div>
            <p className="text-gray-600 text-lg">
              Prepare for the Joint Admissions and Matriculation Board examination with our comprehensive question bank.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Subject and Year Selection Screen
  if (showSelectionPage && typeSel !== 'ALL') {
    const examTypeColor = typeSel === 'WAEC' ? 'green' : 'blue';
    const examTypeBg = typeSel === 'WAEC' ? 'bg-green-50' : 'bg-blue-50';
    const examTypeBorder = typeSel === 'WAEC' ? 'border-green-500' : 'border-blue-500';
    const examTypeText = typeSel === 'WAEC' ? 'text-green-700' : 'text-blue-700';

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${examTypeBg} ${examTypeBorder} border-2 rounded-full mb-4`}>
              {typeSel === 'WAEC' ? (
                <BookOpen className={`w-5 h-5 ${examTypeText}`} />
              ) : (
                <GraduationCap className={`w-5 h-5 ${examTypeText}`} />
              )}
              <span className={`font-semibold ${examTypeText}`}>{typeSel} Mock Exam</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Practice Mode</h1>
            <p className="text-gray-600">Select your subject and exam year to begin</p>
          </div>

          {/* Selection Form */}
          <Card>
            <div className="space-y-6">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Subject <span className="text-red-500">*</span>
                </label>
                {loadingSubjects ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading subjects...</p>
                  </div>
                ) : (
                  <select
                    value={subjectSel || ''}
                    onChange={(e) => setSubjectSel(e.target.value || undefined)}
                    className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 ${
                      typeSel === 'WAEC'
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                        : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                  >
                    <option value="">Select a subject</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject.id} value={subject.slug}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Exam Year
                </label>
                <select
                  value={yearSel === 'ALL' ? 'ALL' : String(yearSel)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setYearSel(value === 'ALL' ? 'ALL' : Number(value));
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 ${
                    typeSel === 'WAEC'
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                      : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                  }`}
                >
                  <option value="ALL">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                </select>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (subjectSel) {
                      setShowSelectionPage(false);
                      applyParams(subjectSel, yearSel, typeSel);
                    }
                  }}
                  disabled={!subjectSel}
                  className="w-full py-4 text-lg font-semibold flex items-center justify-center gap-2"
                >
                  Start Mock Exam
                  <ArrowRight className="w-5 h-5" />
                </Button>
                {!subjectSel && (
                  <p className="text-sm text-red-500 mt-2 text-center">Please select a subject to continue</p>
                )}
              </div>

              {/* Back Button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setTypeSel('ALL');
                    setSubjectSel(undefined);
                    setYearSel('ALL');
                    applyParams(undefined, 'ALL', 'ALL');
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  ← Change Exam Type
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6">Mock Exam</h1>

      {(!current || pool.length === 0) ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No questions available. Please select a subject or try different filters.</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </Card>
      ) : !completed ? (
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