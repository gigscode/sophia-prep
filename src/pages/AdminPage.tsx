import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Users, FileQuestion, BarChart3, FolderTree } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const tabs = [
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart3, color: 'text-blue-600' },
    { id: 'users' as AdminTab, label: 'Users', icon: Users, color: 'text-green-600' },
    { id: 'subjects' as AdminTab, label: 'Subjects', icon: BookOpen, color: 'text-purple-600' },
    { id: 'topics' as AdminTab, label: 'Topics', icon: FolderTree, color: 'text-yellow-600' },
    { id: 'questions' as AdminTab, label: 'Questions', icon: FileQuestion, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your Sophia Prep platform</p>
            </div>
            <div className="text-sm text-gray-500">
              Logged in as: <span className="font-medium text-gray-700">{user.email}</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${tab === t.id ? t.color : ''}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
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
  );
}
