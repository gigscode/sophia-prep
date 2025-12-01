import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { quizService } from '../services/quiz-service';
import { questionService, normalizeQuestions } from '../services/question-service';
import { subjectService } from '../services/subject-service';
import { analyticsService } from '../services/analytics-service';
import { Card } from '../components/ui/Card';
import { OptionButton } from '../components/ui/OptionButton';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import type { Subject } from '../integrations/supabase/types';

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
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const initialSubject = params.get('subject') || undefined;
  const initialYearParam = params.get('year');
  const initialTypeParam = params.get('type');
  const [subjectSel, setSubjectSel] = useState<string | undefined>(initialSubject);
  const [yearSel, setYearSel] = useState<'ALL' | number>(initialYearParam === 'ALL' ? 'ALL' : (initialYearParam ? Number(initialYearParam) : 'ALL'));
  const [typeSel, setTypeSel] = useState<'ALL' | 'JAMB' | 'WAEC'>(
    initialTypeParam === 'JAMB' || initialTypeParam === 'WAEC' || initialTypeParam === 'ALL' 
      ? (initialTypeParam as 'ALL' | 'JAMB' | 'WAEC') 
      : 'ALL'
  );
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
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { exam_year: typeof exam_year === 'number' ? exam_year : undefined, exam_type: exam_type, limit: 50 });
          qs = normalizeQuestions(rows, { exam_year: exam_year as any, exam_type: exam_type });
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

  const next = async () => {
    setSelected(null);
    setShowFeedback(false);
    if (index < pool.length - 1) {
      setIndex(i => i + 1);
    } else {
      // Quiz completed - save attempt and navigate to results
      const timeTaken = Math.floor((Date.now() - Date.now()) / 1000); // Approximate time
      
      // Get subject_id from slug
      let subject_id: string | undefined;
      if (subjectSel) {
        try {
          const subject = await subjectService.getSubjectBySlug(subjectSel);
          subject_id = subject?.id;
        } catch (e) {
          console.error('Failed to get subject:', e);
        }
      }

      // Save quiz attempt
      await analyticsService.saveQuizAttempt({
        subject_id,
        quiz_mode: 'practice',
        total_questions: pool.length,
        correct_answers: score,
        time_taken_seconds: timeTaken || 60,
        exam_year: typeof yearSel === 'number' ? yearSel : undefined,
        questions_data: pool.map(q => ({
          question_id: q.id,
          user_answer: answers[q.id],
          correct_answer: q.correct,
          is_correct: answers[q.id] === q.correct
        }))
      });

      navigate('/quiz/results', {
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
              No time Limits!
              Practice with past questions and mock exams specifically designed for the West African Senior School Certificate Examination. Immediate feedback after each answer with explanations.
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
              Immediate feedback after each answer with explanations.
Prepare for the Joint Admissions and Matriculation Board examination with our comprehensive question bank.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Subject and Year Selection Screen
  if (showSelectionPage && (typeSel === 'JAMB' || typeSel === 'WAEC')) {
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
              <span className={`font-semibold ${examTypeText}`}>{typeSel} Practice</span>
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
                  Start Practice
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