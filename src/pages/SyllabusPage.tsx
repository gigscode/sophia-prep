import { useState, useEffect } from 'react';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { subjectService } from '../services/subject-service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { Subject, ExamType } from '../integrations/supabase/types';

export function SyllabusPage() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Official Syllabus"
        description="Access official JAMB and WAEC syllabi for all subjects"
        icon={BookOpen}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setSelectedExamType('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedExamType === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => setSelectedExamType('JAMB')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedExamType === 'JAMB'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            JAMB Only
          </button>
          <button
            onClick={() => setSelectedExamType('WAEC')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedExamType === 'WAEC'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            WAEC Only
          </button>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {subject.name}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getExamTypeBadgeColor(
                      subject.exam_type
                    )}`}
                  >
                    {subject.exam_type}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{subject.description}</p>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://www.jamb.gov.ng/syllabus/${subject.slug}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Online
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => alert('Download feature coming soon!')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No subjects found for the selected exam type.</p>
          </div>
        )}
      </div>
    </div>
  );
}

