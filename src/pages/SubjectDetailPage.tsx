import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectService } from '../services/subject-service';
import * as LucideIcons from 'lucide-react';
import { BookOpen } from 'lucide-react';
import type { Subject } from '../integrations/supabase/types';

export function SubjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadSubject(slug);
    }
  }, [slug]);

  const loadSubject = async (subjectSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectService.getSubjectBySlug(subjectSlug);
      if (!data) {
        setError('Subject not found');
      } else {
        setSubject(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subject');
    } finally {
      setLoading(false);
    }
  };



  const getExamTypeBadgeColor = (examType: string): string => {
    switch (examType) {
      case 'JAMB':
        return 'bg-blue-100 text-blue-800';
      case 'WAEC':
        return 'bg-green-100 text-green-800';
      case 'BOTH':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading subject...</div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">Error: {error || 'Subject not found'}</div>
        <button
          onClick={() => navigate('/subjects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/subjects')}
        className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
      >
        ← Back to Subjects
      </button>

      {/* Subject Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex items-start gap-6">
          <div
            className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-3xl flex-shrink-0"
            style={{ backgroundColor: subject.color_theme }}
          >
            {(() => {
              const lookup = (name?: string) => {
                if (!name) return null;
                if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
                const pascal = name.split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                if ((LucideIcons as any)[pascal]) return (LucideIcons as any)[pascal];
                const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
                if ((LucideIcons as any)[capFirst]) return (LucideIcons as any)[capFirst];
                return null;
              };

              const IconComp = lookup(subject.icon) || BookOpen;
              return <IconComp className="w-10 h-10" />;
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{subject.name}</h1>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${getExamTypeBadgeColor(
                  subject.exam_type
                )}`}
              >
                {subject.exam_type}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{subject.description}</p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>{' '}
                <span className="font-medium capitalize">
                  {subject.subject_category.toLowerCase()}
                </span>
              </div>
              {subject.is_mandatory && (
                <div>
                  <span className="text-red-600 font-medium">Mandatory Subject</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center md:justify-end">
        <button
          onClick={() => {
            // Store quiz config and navigate directly to unified quiz
            const config = {
              examType: subject.exam_type === 'BOTH' ? 'JAMB' : subject.exam_type,
              mode: 'practice' as const,
              selectionMethod: 'subject' as const,
              subjectSlug: subject.slug,
            };
            sessionStorage.setItem('quizConfig', JSON.stringify(config));
            navigate('/quiz/unified');
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Practice
        </button>
        <button
          onClick={() => {
            // Store quiz config and navigate directly to unified quiz
            const config = {
              examType: subject.exam_type === 'BOTH' ? 'JAMB' : subject.exam_type,
              mode: 'exam' as const,
              selectionMethod: 'subject' as const,
              subjectSlug: subject.slug,
            };
            sessionStorage.setItem('quizConfig', JSON.stringify(config));
            navigate('/quiz/unified');
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Take Quiz
        </button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          View Study Materials
        </button>
      </div>
    </div>
  );
}
