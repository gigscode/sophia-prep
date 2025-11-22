import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { subjectService } from '../services/subject-service';
import { Card } from '../components/ui/Card';
import type { Subject, ExamType } from '../integrations/supabase/types';

interface TopicSummary {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
}

export function SummariesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<ExamType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectService.getAllSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    s => selectedExamType === 'ALL' || s.exam_type === selectedExamType || s.exam_type === 'BOTH'
  );

  // Sample topic summaries (in production, these would come from the database)
  const sampleSummaries: TopicSummary[] = [
    {
      id: '1',
      title: 'Introduction to the Topic',
      content: 'This section provides a comprehensive overview of the fundamental concepts and principles.',
      keyPoints: [
        'Understanding basic definitions and terminology',
        'Historical context and development',
        'Real-world applications and examples',
        'Common misconceptions to avoid'
      ]
    },
    {
      id: '2',
      title: 'Core Concepts',
      content: 'Deep dive into the essential concepts that form the foundation of this subject area.',
      keyPoints: [
        'Key theories and frameworks',
        'Mathematical or logical foundations',
        'Practical problem-solving approaches',
        'Connections to other topics'
      ]
    },
    {
      id: '3',
      title: 'Advanced Topics',
      content: 'Exploration of more complex ideas and their applications in various contexts.',
      keyPoints: [
        'Advanced techniques and methods',
        'Case studies and examples',
        'Common exam questions',
        'Tips for mastery'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Topic Summaries"
        description="Comprehensive summaries with key concepts for each subject"
        icon={<FileText className="w-8 h-8" />}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setSelectedExamType('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedExamType === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            All Subjects
          </button>
          <button
            onClick={() => setSelectedExamType('JAMB')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedExamType === 'JAMB'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            JAMB
          </button>
          <button
            onClick={() => setSelectedExamType('WAEC')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedExamType === 'WAEC'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            WAEC
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Subjects Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h3 className="font-semibold text-gray-800 mb-4">Select Subject</h3>
              <div className="space-y-2">
                {filteredSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedSubject?.id === subject.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Summaries Content */}
          <div className="lg:col-span-3">
            {selectedSubject ? (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedSubject.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{selectedSubject.description}</p>
                </Card>

                {sampleSummaries.map((summary) => (
                  <Card key={summary.id}>
                    <button
                      onClick={() => setExpandedTopic(expandedTopic === summary.id ? null : summary.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{summary.title}</h3>
                      {expandedTopic === summary.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {expandedTopic === summary.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-700 mb-4">{summary.content}</p>
                        <h4 className="font-semibold text-gray-800 mb-2">Key Points:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {summary.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-gray-600">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a subject to view topic summaries</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

