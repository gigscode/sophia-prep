/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * Use UnifiedQuiz component with ModeSelectionPage instead.
 * Routes now redirect to /quiz/mode-selection
 */

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

/**
 * @deprecated Use UnifiedQuiz with ModeSelectionPage instead
 */
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
  const [typeSel] = useState<'JAMB'>('JAMB');
  const [showSelectionPage, setShowSelectionPage] = useState(!initialSubject);

  const applyParams = (sub?: string | undefined, yr?: 'ALL' | number) => {
    const sp = new URLSearchParams();
    const s = sub ?? subjectSel;
    const y = yr ?? yearSel;
    if (s) sp.set('subject', s);
    if (y) sp.set('year', y === 'ALL' ? 'ALL' : String(y));
    sp.set('type', 'JAMB');
    const url = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', url);
  };

  // Load subjects for JAMB
  useEffect(() => {
    (async () => {
      setLoadingSubjects(true);
      try {
        const subjects = await subjectService.getSubjectsByExamType('JAMB');
        setAvailableSubjects(subjects);
      } catch (e) {
        console.error('Failed to load subjects:', e);
        setAvailableSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const subject = subjectSel;
        const exam_year = yearSel;
        const exam_type = 'JAMB';
        let qs: any[] = [];
        if (subject) {
          const rows = await questionService.getQuestionsBySubjectSlug(subject, { exam_year: typeof exam_year === 'number' ? exam_year : undefined, exam_type: exam_type, limit: 50 });
          qs = normalizeQuestions(rows, { exam_year: exam_year, exam_type: exam_type });
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

  const next = useCallback(async () => {
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
  }, [index, pool, subjectSel, yearSel, score, answers, navigate]);

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
  }, [onSelect, pool.length, showFeedback, next]);



  // Subject and Year Selection Screen
  if (showSelectionPage) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border-blue-500 border-2 rounded-full mb-4">
              <GraduationCap className="w-5 h-5 text-blue-700" />
              <span className="font-semibold text-blue-700">JAMB Practice</span>
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
                    className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 border-blue-300 focus:border-blue-500 focus:ring-blue-200"
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
                  className="w-full px-4 py-3 border-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 border-blue-300 focus:border-blue-500 focus:ring-blue-200"
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
              {q.options.map((opt) => (
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