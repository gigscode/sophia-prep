import { useState, useEffect } from 'react';
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

export function ReaderModeQuiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [subjectSel, setSubjectSel] = useState<string>('');
  const [yearSel, setYearSel] = useState<number | 'ALL'>('ALL');
  const [typeSel, setTypeSel] = useState<'ALL' | 'JAMB' | 'WAEC'>('ALL');

  // Load questions from Supabase
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let qs: QuizQuestion[] = [];
        if (subjectSel) {
          const rows = await questionService.getQuestionsBySubjectSlug(
            subjectSel,
            {
              exam_year: typeof yearSel === 'number' ? yearSel : undefined,
              exam_type: typeSel === 'ALL' ? undefined : typeSel,
              limit: 50
            }
          );
          qs = normalizeQuestions(rows, { exam_year: yearSel as any, exam_type: typeSel as any });
        } else {
          qs = await quizService.getRandomQuestions(20);
        }
        if (qs && qs.length > 0) {
          setQuestions(qs);
        }
      } catch (e) {
        console.error('Failed to load questions:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectSel, yearSel, typeSel]);

  const q = questions[index];

  const select = (key: string) => {
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
          questions,
          answers,
          score,
          totalQuestions: questions.length,
          quizMode: 'reader',
          subject: subjectSel,
        },
      });
    }
  };

  const prev = () => {
    setSelected(null);
    setIndex(i => Math.max(0, i - 1));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Reader Mode</h1>
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!q || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Reader Mode</h1>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No questions available. Please select a subject or try again.</p>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </Card>
      </div>
    );
  }

  const isCorrect = selected === q.correct;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Reader Mode</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <select
              value={subjectSel}
              onChange={(e) => {
                setSubjectSel(e.target.value);
                setIndex(0);
                setSelected(null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Random Mix</option>
              <option value="mathematics">Mathematics</option>
              <option value="english-language">English Language</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
              <option value="economics">Economics</option>
              <option value="commerce">Commerce</option>
              <option value="accounting">Accounting</option>
              <option value="government">Government</option>
              <option value="geography">Geography</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <select
              value={yearSel}
              onChange={(e) => {
                setYearSel(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setIndex(0);
                setSelected(null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="ALL">All Years</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Exam Type</label>
            <select
              value={typeSel}
              onChange={(e) => {
                setTypeSel(e.target.value as any);
                setIndex(0);
                setSelected(null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="ALL">All</option>
              <option value="JAMB">JAMB</option>
              <option value="WAEC">WAEC</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Quiz Card */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Question {index + 1} / {questions.length}
          </div>
          <div className="text-sm font-medium text-blue-600">
            Reader Mode
          </div>
        </div>

        <ProgressBar value={index + 1} max={questions.length} className="mb-6" />

        <div className="mb-6">
          <p className="text-base md:text-lg font-semibold mb-4">{q.text}</p>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt) => (
              <OptionButton
                key={opt.key}
                optionKey={opt.key}
                text={opt.text}
                selected={selected === opt.key}
                onSelect={select}
                disabled={!!selected}
              />
            ))}
          </div>
        </div>

        {/* Immediate Feedback */}
        {selected && (
          <div className={`p-4 rounded-lg border-2 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <div className={`font-semibold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Correct answer:</span> {q.correct}
            </div>
            {q.explanation && (
              <div className="text-sm text-gray-700 mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium">Explanation:</span> {q.explanation}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 gap-3">
          <Button
            onClick={prev}
            disabled={index === 0}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={next}
            disabled={index === questions.length - 1}
          >
            Next Question
          </Button>
        </div>
      </Card>
    </div>
  );
}