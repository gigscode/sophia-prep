import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { AuthProvider } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton';
import PWAInstall from './components/PWAInstall';
import { ToastContainer } from './components/ui/Toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { performStartupDatabaseChecks } from './utils/database-verification';

// Lazy load all pages
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then(module => ({ default: module.SubjectsPage })));
const SubjectDetailPage = lazy(() => import('./pages/SubjectDetailPage').then(module => ({ default: module.SubjectDetailPage })));
const StudyHub = lazy(() => import('./pages/StudyHub').then(module => ({ default: module.StudyHub })));
const SyllabusPage = lazy(() => import('./pages/SyllabusPage').then(module => ({ default: module.SyllabusPage })));
const SummariesPage = lazy(() => import('./pages/SummariesPage').then(module => ({ default: module.SummariesPage })));
const NovelsPage = lazy(() => import('./pages/NovelsPage').then(module => ({ default: module.NovelsPage })));
const VideosPage = lazy(() => import('./pages/VideosPage').then(module => ({ default: module.VideosPage })));
const QuizModeSelectorPage = lazy(() => import('./pages/QuizModeSelectorPage').then(module => ({ default: module.QuizModeSelectorPage })));
const ModeSelectionPage = lazy(() => import('./pages/ModeSelectionPage').then(module => ({ default: module.ModeSelectionPage })));
const UnifiedQuiz = lazy(() => import('./pages/UnifiedQuiz').then(module => ({ default: module.UnifiedQuiz })));
const QuizResultsPage = lazy(() => import('./pages/QuizResultsPage').then(module => ({ default: module.QuizResultsPage })));
const HelpCenter = lazy(() => import('./pages/HelpCenter').then(module => ({ default: module.HelpCenter })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then(module => ({ default: module.TermsOfServicePage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(module => ({ default: module.ContactPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
const ImportQuestionsPage = lazy(() => import('./pages/ImportQuestionsPage').then(module => ({ default: module.ImportQuestionsPage })));
const MorePage = lazy(() => import('./pages/MorePage').then(module => ({ default: module.MorePage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" />
  </div>
);

export function App() {
  // Perform startup database verification checks
  useEffect(() => {
    // Run verification in the background, don't block app startup
    performStartupDatabaseChecks().catch(error => {
      console.error('[APP] Startup verification failed:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <ScrollToTop />
      <WhatsAppButton />
      <PWAInstall />
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home - Modern UI Redesign with BottomNavigation */}
          <Route path="/" element={<HomePage />} />

          {/* Subjects */}
          <Route path="/subjects" element={<Layout showFooter={false}><SubjectsPage /></Layout>} />
          <Route path="/subjects/:slug" element={<Layout><SubjectDetailPage /></Layout>} />

          {/* Study Resources */}
          <Route path="/study" element={<Layout showFooter={false}><StudyHub /></Layout>} />
          <Route path="/syllabus" element={<Layout><SyllabusPage /></Layout>} />
          <Route path="/summaries" element={<Layout><SummariesPage /></Layout>} />
          <Route path="/novels" element={<Layout><NovelsPage /></Layout>} />
          <Route path="/videos" element={<Layout><VideosPage /></Layout>} />

          {/* Quiz Routes */}
          <Route path="/quiz" element={<Layout showFooter={false}><QuizModeSelectorPage /></Layout>} />
          <Route path="/quiz/mode-selection" element={<Layout showFooter={false}><ModeSelectionPage /></Layout>} />
          <Route path="/quiz/unified" element={<Layout showFooter={false}><UnifiedQuiz /></Layout>} />
          {/* Legacy routes - redirect to new unified system */}
          <Route path="/quiz/practice" element={<Navigate to="/quiz/mode-selection" state={{ preselectedMode: 'practice' }} replace />} />
          <Route path="/quiz/cbt" element={<Navigate to="/quiz/mode-selection" state={{ preselectedMode: 'exam' }} replace />} />
          <Route path="/quiz/results" element={<Layout showFooter={false}><QuizResultsPage /></Layout>} />

          {/* Help & Info */}
          <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPolicyPage /></Layout>} />
          <Route path="/terms" element={<Layout><TermsOfServicePage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

          {/* Events - placeholder routes until EventsPage is created */}
          <Route path="/events" element={<Navigate to="/" replace />} />
          <Route path="/events/:id" element={<Navigate to="/" replace />} />

          {/* More Page */}
          <Route path="/more" element={<Layout showFooter={false}><MorePage /></Layout>} />

          {/* Profile / Auth */}
          <Route path="/profile" element={<Layout showFooter={false}><ProfilePage /></Layout>} />
          <Route path="/login" element={<Layout showFooter={false}><LoginPage /></Layout>} />
          <Route path="/signup" element={<Layout showFooter={false}><SignupPage /></Layout>} />
          <Route path="/forgot-password" element={<Layout showFooter={false}><ForgotPasswordPage /></Layout>} />
          <Route path="/reset-password" element={<Layout showFooter={false}><ResetPasswordPage /></Layout>} />

          {/* Admin - Now with BottomNavigation */}
          <Route path="/7351/admin" element={<Layout showFooter={false}><AdminPage /></Layout>} />
          <Route path="/admin/import-questions" element={<Layout showFooter={false}><ImportQuestionsPage /></Layout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}