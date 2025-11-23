import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PageHeader } from '../components/layout';
import { subjectService } from '../services/subject-service';
import type { Subject, ExamType } from '../integrations/supabase/types';

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<ExamType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, selectedExamType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subjectService.getAllSubjects();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    if (selectedExamType === 'ALL') {
      setFilteredSubjects(subjects);
    } else {
      setFilteredSubjects(
        subjects.filter(
          s => s.exam_type === selectedExamType || s.exam_type === 'BOTH'
        )
      );
    }
  };

  const getExamTypeBadgeColor = (examType: ExamType): string => {
    switch (examType) {
      case 'JAMB':
        return 'bg-blue-100 text-blue-800';
      case 'WAEC':
        return 'bg-green-100 text-green-800';
      case 'BOTH':
        return 'bg-purple-100 text-purple-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading subjects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Browse and select subjects for your JAMB or WAEC preparation"
        icon={<BookOpen className="w-8 h-8" />}
        breadcrumbs={[{ label: 'Subjects' }]}
      />

      <div className="container mx-auto px-4 py-8">

      {/* Exam Type Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Exam Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedExamType('ALL')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedExamType === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => setSelectedExamType('JAMB')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedExamType === 'JAMB'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            JAMB
          </button>
          <button
            onClick={() => setSelectedExamType('WAEC')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedExamType === 'WAEC'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            WAEC
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <div
            key={subject.id}
            className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            style={{ borderColor: subject.color_theme }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: subject.color_theme }}
                >
                  {(() => {
                    // subject.icon may be stored in kebab-case (e.g. 'book-open')
                    // while lucide-react exports use PascalCase names (e.g. 'BookOpen').
                    // Try direct lookup, then normalize to PascalCase, then fallback to BookOpen.
                    const lookup = (name?: string) => {
                      if (!name) return null;
                      // direct
                      if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
                      // normalize kebab/snake/space to PascalCase: "book-open" -> "BookOpen"
                      const pascal = name
                        .split(/[-_\s]+/)
                        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                        .join('');
                      if ((LucideIcons as any)[pascal]) return (LucideIcons as any)[pascal];
                      // try capitalizing the first letter only (in case stored as 'bookOpen')
                      const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
                      if ((LucideIcons as any)[capFirst]) return (LucideIcons as any)[capFirst];
                      return null;
                    };

                    const IconComp = lookup(subject.icon) || BookOpen;
                    return <IconComp className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{subject.name}</h3>
                  {subject.is_mandatory && (
                    <span className="text-xs text-red-600 font-medium">
                      Mandatory
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getExamTypeBadgeColor(
                  subject.exam_type
                )}`}
              >
                {subject.exam_type}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{subject.description}</p>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-gray-500 capitalize">
                {subject.subject_category.toLowerCase()}
              </span>
              <div className="flex items-center gap-2">
                <Link to={`/practice?subject=${encodeURIComponent(subject.slug)}&year=ALL&type=ALL`} className="px-3 py-2 bg-blue-600 text-white rounded text-xs">Practice</Link>
                <Link to={`/mock-exams?subject=${encodeURIComponent(subject.slug)}&year=ALL&type=ALL`} className="px-3 py-2 bg-yellow-400 text-blue-900 rounded text-xs">Mock</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No subjects found for the selected filter.
        </div>
      )}
      </div>
    </>
  );
}
