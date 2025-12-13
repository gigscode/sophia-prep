import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { subjectService } from '../services/subject-service';
import { Card } from '../components/ui/Card';
import type { Subject } from '../integrations/supabase/types';

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

  // Filter subjects for JAMB only
  const filteredSubjects = subjects.filter(s => s.is_active);

  // TODO: Load topic summaries from database
  const sampleSummaries: TopicSummary[] = [];

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
        description="Comprehensive summaries with key concepts for JAMB subjects"
        icon={<FileText className="w-8 h-8" />}
      />

      <div className="container mx-auto px-4 py-8">

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

