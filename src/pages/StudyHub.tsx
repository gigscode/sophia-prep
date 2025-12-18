import { ListChecks, BookOpen } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';

export function StudyHub() {
  const { navigate, isNavigating } = useNavigation();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Study Hub</h1>
        <p className="text-gray-600 mb-8">
          Access learning resources including syllabi, topic summaries, and novels.
        </p>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            onClick={() => navigate('/novels')}
            disabled={isNavigating}
            className="sophia-card p-6 hover:shadow-lg transition-shadow text-left w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-4 mb-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold">Novels</h3>
            </div>
            <p className="text-gray-600">Prescribed novels and literary analyses</p>
          </button>
        </div>
      </div>
    </div>
  );
}