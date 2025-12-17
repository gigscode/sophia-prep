import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { BookOpen, Users, FileQuestion, BarChart3, Menu, X, Home, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserManagement } from '../components/admin/UserManagement';
import { SubjectManagement } from '../components/admin/SubjectManagement';
import { QuestionManagement } from '../components/admin/QuestionManagement';
import { TopicManagement } from '../components/admin/TopicManagement';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { PDFManagement } from '../components/admin/PDFManagement';
import { SubjectConsistencyTest } from '../components/SubjectConsistencyTest';

type AdminTab = 'analytics' | 'users' | 'subjects' | 'questions' | 'topics' | 'pdfs';

export function AdminPage() {
  const { user, loading } = useAuth();
  const { navigate } = useNavigation();
  const [tab, setTab] = useState<AdminTab>('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleResize = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    // Set initial value
    setIsDesktop(mediaQuery.matches);

    // Add listener
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin panel.
            <br />
            Current user: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user.email}</span>
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'users' as AdminTab, label: 'Users', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'subjects' as AdminTab, label: 'Subjects', icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'topics' as AdminTab, label: 'Topics', icon: BookOpen, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'questions' as AdminTab, label: 'Questions', icon: FileQuestion, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'pdfs' as AdminTab, label: 'PDF Files', icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header Bar - Always visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-[70] flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
        <h1 className="ml-3 text-lg font-semibold text-gray-800">Admin Panel</h1>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : (sidebarOpen ? 0 : '-100%'),
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="fixed top-16 lg:top-0 left-0 h-[calc(100%-4rem)] lg:h-full w-64 bg-white border-r border-gray-200 shadow-lg z-[60] lg:z-0"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
              <p className="text-sm text-gray-500 mt-1">Sophia Prep</p>
            </div>
            {/* Close button for mobile inside sidebar */}
            {!isDesktop && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    if (!isDesktop) setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 ${isActive
                    ? `${item.bgColor} ${item.color} border-r-4 border-current font-semibold`
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="my-2 border-t border-gray-100 mx-6"></div>

            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            >
              <Home className="w-5 h-5 text-gray-400" />
              <span>Back to Home</span>
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-200 mb-12">
            <div className="text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">Logged in as:</p>
              <p className="truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen mb-12 pt-16 lg:pt-0">
        <div className="container mx-auto px-4 py-6 md:py-8 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {menuItems.find(m => m.id === tab)?.label}
            </h1>
            <p className="text-gray-600">
              Manage your Sophia Prep platform
            </p>
          </motion.div>

          {/* Content Area */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {tab === 'analytics' && <AnalyticsDashboard />}
            {tab === 'users' && <UserManagement />}
            {tab === 'subjects' && (
              <>
                <SubjectConsistencyTest />
                <SubjectManagement />
              </>
            )}
            {tab === 'topics' && <TopicManagement />}
            {tab === 'questions' && <QuestionManagement />}
            {tab === 'pdfs' && <PDFManagement />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
