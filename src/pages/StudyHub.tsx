import { Film, FileText, Library, ListChecks } from 'lucide-react';
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
            onClick={() => navigate('/novels')}
            disabled={isNavigating}
            className="sophia-card p-6 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <Library className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold">Novels</h3>
            </div>
            <p className="text-gray-600">Prescribed novels, summaries, themes, and analyses</p>
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