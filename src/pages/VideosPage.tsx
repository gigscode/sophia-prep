import { useState, useEffect } from 'react';
import { Film, Play, Clock, ExternalLink } from 'lucide-react';
import { PageHeader } from '../components/layout';
import { subjectService } from '../services/subject-service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { Subject, ExamType } from '../integrations/supabase/types';

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  url: string;
  topic: string;
}

export function VideosPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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

  // Sample video lessons (in production, these would come from the database)
  const sampleVideos: VideoLesson[] = [
    {
      id: '1',
      title: 'Introduction to the Topic',
      description: 'A comprehensive introduction covering the fundamental concepts and principles.',
      duration: '15:30',
      thumbnail: 'https://via.placeholder.com/320x180/2563EB/FFFFFF?text=Video+1',
      url: 'https://www.youtube.com/watch?v=example1',
      topic: 'Fundamentals'
    },
    {
      id: '2',
      title: 'Core Concepts Explained',
      description: 'Deep dive into the essential concepts with practical examples and demonstrations.',
      duration: '22:45',
      thumbnail: 'https://via.placeholder.com/320x180/7C3AED/FFFFFF?text=Video+2',
      url: 'https://www.youtube.com/watch?v=example2',
      topic: 'Core Concepts'
    },
    {
      id: '3',
      title: 'Problem Solving Techniques',
      description: 'Learn effective strategies for solving common problems and exam questions.',
      duration: '18:20',
      thumbnail: 'https://via.placeholder.com/320x180/059669/FFFFFF?text=Video+3',
      url: 'https://www.youtube.com/watch?v=example3',
      topic: 'Practice'
    },
    {
      id: '4',
      title: 'Advanced Applications',
      description: 'Explore advanced topics and their real-world applications.',
      duration: '25:10',
      thumbnail: 'https://via.placeholder.com/320x180/DC2626/FFFFFF?text=Video+4',
      url: 'https://www.youtube.com/watch?v=example4',
      topic: 'Advanced'
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
        title="Video Lessons"
        description="Learn with curated video lessons organized by subject and topic"
        icon={Film}
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
            JAMB
          </button>
          <button
            onClick={() => setSelectedExamType('WAEC')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedExamType === 'WAEC'
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
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedSubject?.id === subject.id
                        ? 'bg-red-100 text-red-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Videos Content */}
          <div className="lg:col-span-3">
            {selectedSubject ? (
              <div className="space-y-4">
                <Card>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedSubject.name} - Video Lessons
                  </h2>
                  <p className="text-gray-600">{selectedSubject.description}</p>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sampleVideos.map((video) => (
                    <Card key={video.id} className="hover:shadow-lg transition-shadow">
                      <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-200 group">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {video.duration}
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-800 mb-2">{video.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {video.topic}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Watch
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Film className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">More Videos Coming Soon!</h4>
                      <p className="text-sm text-blue-700">
                        We're constantly adding new video lessons. Check back regularly for updates on {selectedSubject.name} and other subjects.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a subject to view video lessons</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

