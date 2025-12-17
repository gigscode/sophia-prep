import { Film, FileText, Library, ListChecks, BookOpen, Target } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';

export function StudyHub() {
  const { navigate, isNavigating } = useNavigation();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Study Hub</h1>
        <p className="text-gray-600 mb-8">
          Access learning resources including syllabi, topic summaries, novels, and video lessons.
        </p>

        {/* Topics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Study by Topics
          </h2>
          <p className="text-gray-600 mb-6">
            Browse and practice questions organized by specific topics within each subject.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Physics', slug: 'physics', color: 'bg-red-500' },
              { name: 'Mathematics', slug: 'mathematics', color: 'bg-blue-500' },
              { name: 'Chemistry', slug: 'chemistry', color: 'bg-green-500' },
              { name: 'Biology', slug: 'biology', color: 'bg-purple-500' },
              { name: 'English Language', slug: 'english', color: 'bg-yellow-500' },
              { name: 'Economics', slug: 'economics', color: 'bg-indigo-500' },
              { name: 'Government', slug: 'government', color: 'bg-pink-500' },
              { name: 'Geography', slug: 'geography', color: 'bg-teal-500' }
            ].map(subject => (
              <button
                key={subject.slug}
                onClick={() => navigate(`/topics/${subject.slug}`)}
                disabled={isNavigating}
                className="sophia-card p-4 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                  <span className="font-medium text-gray-900">{subject.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Study Resources */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-600" />
            Study Resources
          </h2>
          <p className="text-gray-600 mb-6">
            Access comprehensive learning materials and resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button 
            onClick={() => navigate('/syllabus')}
            disabled={isNavigating}
            className="sophia-card p-6 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <ListChecks className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Syllabus</h3>
            </div>
            <p className="text-gray-600">Official JAMB syllabi organized by subjects</p>
          </button>

          <button 
            onClick={() => navigate('/summaries')}
            disabled={isNavigating}
            className="sophia-card p-6 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <FileText className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-semibold">Topic Summaries</h3>
            </div>
            <p className="text-gray-600">Comprehensive summaries with key concepts and examples</p>
          </button>

          <button 
            onClick={() => navigate('/study-materials')}
            disabled={isNavigating}
            className="sophia-card p-6 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <Library className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold">Study Materials</h3>
            </div>
            <p className="text-gray-600">Access study materials, novels, and syllabus files</p>
          </button>

          <button 
            onClick={() => navigate('/videos')}
            disabled={isNavigating}
            className="sophia-card p-6 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <Film className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-semibold">Video Lessons</h3>
            </div>
            <p className="text-gray-600">Learn with curated video lessons per topic</p>
          </button>
        </div>
      </div>
    </div>
  );
}