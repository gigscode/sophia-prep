import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Users, FileQuestion, BarChart3, FolderTree, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserManagement } from '../components/admin/UserManagement';
import { SubjectManagement } from '../components/admin/SubjectManagement';
import { TopicManagement } from '../components/admin/TopicManagement';
import { QuestionManagement } from '../components/admin/QuestionManagement';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';

type AdminTab = 'analytics' | 'users' | 'subjects' | 'topics' | 'questions';

export function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  if (!user || !user.isAdmin) {
    return null;
  }

  const menuItems = [
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'users' as AdminTab, label: 'Users', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'subjects' as AdminTab, label: 'Subjects', icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'topics' as AdminTab, label: 'Topics', icon: FolderTree, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { id: 'questions' as AdminTab, label: 'Questions', icon: FileQuestion, color: 'text-red-600', bgColor: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-lg z-40 lg:z-0">
        <motion.div
          initial={false}
          animate={{
            x: isDesktop ? 0 : (sidebarOpen ? 0 : '-100%'),
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="h-full"
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
              <p className="text-sm text-gray-500 mt-1">Sophia Prep</p>
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
            </nav>

            {/* Sidebar Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p className="font-medium text-gray-700 mb-1">Logged in as:</p>
                <p className="truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
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
            {tab === 'subjects' && <SubjectManagement />}
            {tab === 'topics' && <TopicManagement />}
            {tab === 'questions' && <QuestionManagement />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
