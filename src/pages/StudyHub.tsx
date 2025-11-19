import { Link } from 'react-router-dom';
import { BookOpen, Film, FileText, Library, ListChecks } from 'lucide-react';

export function StudyHub() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Study Hub</h1>
        <p className="text-gray-600 mb-8">
          Access syllabi, topic summaries, novels, past questions, and video lessons.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/syllabus" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <ListChecks className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Syllabus</h3>
            </div>
            <p className="text-gray-600">Official JAMB and WAEC syllabi organized by subjects</p>
          </Link>

          <Link to="/summaries" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <FileText className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-semibold">Topic Summaries</h3>
            </div>
            <p className="text-gray-600">Comprehensive summaries with key concepts and examples</p>
          </Link>

          <Link to="/novels" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <Library className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold">Novels</h3>
            </div>
            <p className="text-gray-600">Prescribed novels, summaries, themes, and analyses</p>
          </Link>

          <Link to="/past-questions" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <BookOpen className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-semibold">Past Questions</h3>
            </div>
            <p className="text-gray-600">Practice official past questions by year</p>
          </Link>

          <Link to="/videos" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <Film className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-semibold">Video Lessons</h3>
            </div>
            <p className="text-gray-600">Learn with curated video lessons per topic</p>
          </Link>
        </div>
      </div>
    </div>
  );
}