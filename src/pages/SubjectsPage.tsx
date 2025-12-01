import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PageHeader } from '../components/layout';
import { subjectService } from '../services/subject-service';
import type { Subject, ExamType, SubjectCategory } from '../integrations/supabase/types';

type CategoryFilter = SubjectCategory | 'ALL';

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [selectedExamType, setSelectedExamType] = useState<ExamType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
    // Load saved category preference from session storage
    const savedCategory = sessionStorage.getItem('preferredCategory') as CategoryFilter;
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, selectedExamType, selectedCategory]);

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
    let filtered = subjects;

    // Filter by exam type
    if (selectedExamType !== 'ALL') {
      filtered = filtered.filter(
        s => s.exam_type === selectedExamType || s.exam_type === 'BOTH'
      );
    }

    // Filter by category (always show GENERAL and LANGUAGE subjects)
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(
        s => s.subject_category === selectedCategory ||
             s.subject_category === 'GENERAL' ||
             s.subject_category === 'LANGUAGE'
      );
    }

    setFilteredSubjects(filtered);
  };

  const handleCategoryChange = (category: CategoryFilter) => {
    setSelectedCategory(category);
    // Save to session storage
    sessionStorage.setItem('preferredCategory', category);
  };

  const getCategoryCount = (category: CategoryFilter): number => {
    if (category === 'ALL') return subjects.length;
    return subjects.filter(
      s => s.subject_category === category ||
           s.subject_category === 'GENERAL' ||
           s.subject_category === 'LANGUAGE'
    ).length;
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

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* Exam Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-700">Filter by Exam Type</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedExamType('ALL')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedExamType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Exams
            </button>
            <button
              onClick={() => setSelectedExamType('JAMB')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedExamType === 'JAMB'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              JAMB
            </button>
            <button
              onClick={() => setSelectedExamType('WAEC')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedExamType === 'WAEC'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              WAEC
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium mb-3 text-gray-700">Filter by Subject Category</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('ALL')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedCategory === 'ALL'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Subjects
              <span className="ml-2 text-xs opacity-75">({getCategoryCount('ALL')})</span>
            </button>
            <button
              onClick={() => handleCategoryChange('SCIENCE')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedCategory === 'SCIENCE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Science
              <span className="ml-2 text-xs opacity-75">({getCategoryCount('SCIENCE')})</span>
            </button>
            <button
              onClick={() => handleCategoryChange('ARTS')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedCategory === 'ARTS'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Arts
              <span className="ml-2 text-xs opacity-75">({getCategoryCount('ARTS')})</span>
            </button>
            <button
              onClick={() => handleCategoryChange('COMMERCIAL')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                selectedCategory === 'COMMERCIAL'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Commercial
              <span className="ml-2 text-xs opacity-75">({getCategoryCount('COMMERCIAL')})</span>
            </button>
          </div>
        </div>

        {/* Active Filters Info */}
        {(selectedExamType !== 'ALL' || selectedCategory !== 'ALL') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredSubjects.length}</span> subject{filteredSubjects.length !== 1 ? 's' : ''}
              {selectedExamType !== 'ALL' && <span> for <span className="font-semibold">{selectedExamType}</span></span>}
              {selectedCategory !== 'ALL' && <span> in <span className="font-semibold">{selectedCategory}</span> category</span>}
            </p>
          </div>
        )}
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
                <Link to={`/quiz/practice?subject=${encodeURIComponent(subject.slug)}&year=ALL&type=ALL`} className="px-3 py-2 bg-blue-600 text-white rounded text-xs">Practice</Link>
                <Link to={`/quiz/cbt?subject=${encodeURIComponent(subject.slug)}&year=ALL&type=ALL`} className="px-3 py-2 text-white rounded text-xs" style={{ backgroundColor: '#95db83ff' }}>Quiz</Link>
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
