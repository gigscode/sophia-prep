import { BookOpen, FileText, Users, Lightbulb, Quote, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigation } from '../../hooks/useNavigation';

export function StudyMaterialsPage() {
  const { navigate } = useNavigation();

  // Study materials categories
  const categories = [
    {
      id: 'summaries',
      title: 'Topic Summaries',
      icon: FileText,
      description: 'Comprehensive summaries with key concepts and examples',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      route: '/summaries'
    },
    {
      id: 'guides',
      title: 'Study Guides',
      icon: Lightbulb,
      description: 'Detailed study guides and learning materials',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      route: '/help'
    }
  ];

  // Quick access links
  const quickLinks = [
    {
      title: 'Novels',
      description: 'Prescribed novels and literary analyses',
      icon: BookOpen,
      route: '/novels',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Syllabus',
      description: 'Official JAMB syllabi and curriculum',
      icon: Quote,
      route: '/syllabus',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Study Materials</h1>
          </div>
          <p className="text-xl text-gray-600">
            Access comprehensive learning resources to enhance your exam preparation
          </p>
        </motion.div>

        {/* Quick Access Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickLinks.map((link, index) => (
              <motion.button
                key={link.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(link.route)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-left w-full"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${link.bgColor} rounded-lg`}>
                    <link.icon className={`w-6 h-6 ${link.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {link.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {link.description}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm">
                      <span>Access now</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Study Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => navigate(category.route)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-left w-full"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 ${category.bgColor} rounded-lg mb-4`}>
                    <category.icon className={`w-8 h-8 ${category.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-1 text-blue-600 text-sm">
                    <span>Explore</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-lg shadow-sm p-8 text-center"
        >
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            More Resources Coming Soon
          </h3>
          <p className="text-gray-600">
            We're continuously adding new study materials, practice tests, and learning resources to help you succeed.
          </p>
        </motion.div>
      </div>
    </div>
  );
}