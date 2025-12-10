import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Microscope, Briefcase, BookOpen, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { subjectService } from '../../services/subject-service';
import type { ExamType, ClassCategory } from '../../types/quiz-config';
import type { Subject } from '../../integrations/supabase/types';

interface ClassCategorySelectorProps {
  examType: ExamType;
  onBack?: () => void;
}

interface CategoryInfo {
  id: ClassCategory;
  name: string;
  description: string;
  icon: typeof Microscope;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'SCIENCE',
    name: 'Science',
    description: 'Physics, Chemistry, Biology, Mathematics',
    icon: Microscope,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'ARTS',
    name: 'Arts',
    description: 'Literature, Government, History, CRS/IRS',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'COMMERCIAL',
    name: 'Commercial',
    description: 'Economics, Commerce, Accounting',
    icon: Briefcase,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
];

export function ClassCategorySelector({ examType, onBack }: ClassCategorySelectorProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      try {
        const allSubjects = await subjectService.getSubjectsByExamType(examType);
        setSubjects(allSubjects);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [examType]);

  const getSubjectsForCategory = (category: ClassCategory): string[] => {
    // Get subjects that match the category
    const categorySubjects = subjects.filter(
      (s) => s.subject_category === category || s.subject_category === 'GENERAL' || s.subject_category === 'LANGUAGE'
    );

    // For JAMB, we need 4 subjects per category
    // For WAEC, we can have more subjects
    const subjectSlugs = categorySubjects.map((s) => s.slug);

    // Define standard subject combinations
    const combinations: Record<ClassCategory, string[]> = {
      SCIENCE: ['english', 'mathematics', 'physics', 'chemistry', 'biology'].filter((slug) =>
        subjectSlugs.includes(slug)
      ),
      ARTS: ['english', 'mathematics', 'literature', 'government', 'history', 'crs', 'irs'].filter((slug) =>
        subjectSlugs.includes(slug)
      ),
      COMMERCIAL: ['english', 'mathematics', 'economics', 'commerce', 'accounting'].filter((slug) =>
        subjectSlugs.includes(slug)
      ),
    };

    return combinations[category] || [];
  };

  const handleCategorySelect = (category: ClassCategory) => {
    const categorySubjects = getSubjectsForCategory(category);

    if (categorySubjects.length === 0) {
      alert(`No subjects available for ${category} category. Please try another category.`);
      return;
    }

    // Navigate to unified quiz with category configuration
    navigate('/quiz/unified', {
      state: {
        examType,
        mode: 'exam', // CBT Exam is always in exam mode
        selectionMethod: 'category',
        classCategory: category,
        subjectSlugs: categorySubjects,
      },
    });
  };

  const getCategoryAvailability = (category: ClassCategory): { available: boolean; count: number } => {
    const categorySubjects = getSubjectsForCategory(category);
    return {
      available: categorySubjects.length > 0,
      count: categorySubjects.length,
    };
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Select Class Category</h1>
        <p className="text-gray-600">
          Choose your class category for {examType} CBT Exam simulation
        </p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map((category) => {
            const { available, count } = getCategoryAvailability(category.id);
            const Icon = category.icon;

            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                disabled={!available}
                className={`
                  ${category.bgColor} ${category.borderColor}
                  border-2 rounded-lg p-6 text-left
                  transition-all duration-200
                  ${
                    available
                      ? 'hover:shadow-lg hover:scale-105 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${category.color} p-3 rounded-lg bg-white`}>
                    <Icon size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    {available ? (
                      <>
                        <span className="font-semibold">{count} subjects</span> available
                      </>
                    ) : (
                      <span className="text-red-600">No subjects available</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

