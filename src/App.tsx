import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { HomePage } from './pages/HomePage.tsx';
import { SubjectsPage } from './pages/SubjectsPage.tsx';
import { SubjectDetailPage } from './pages/SubjectDetailPage.tsx';
import { QuizModeSelectorPage } from './pages/QuizModeSelectorPage.tsx';
import { PracticeModeQuiz } from './pages/PracticeModeQuiz.tsx';
import { MockExamQuiz } from './pages/MockExamQuiz.tsx';
import { ReaderModeQuiz } from './pages/ReaderModeQuiz.tsx';
import { PastQuestionsQuiz } from './pages/PastQuestionsQuiz.tsx';
import { StudyHub } from './pages/StudyHub.tsx';
import { HelpCenter } from './pages/HelpCenter.tsx';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminPage } from './pages/AdminPage';
import { AuthProvider } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton';

export function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <WhatsAppButton />
      <Routes>
      {/* HomePage without Layout - it has its own design */}
      <Route path="/" element={<HomePage />} />

      {/* All other routes wrapped with Layout */}
      <Route path="/subjects" element={<Layout><SubjectsPage /></Layout>} />
      <Route path="/subjects/:slug" element={<Layout><SubjectDetailPage /></Layout>} />

      {/* Quiz Modes */}
      <Route path="/quiz" element={<Layout><QuizModeSelectorPage /></Layout>} />
      <Route path="/practice" element={<Layout><PracticeModeQuiz /></Layout>} />
      <Route path="/mock-exams" element={<Layout><MockExamQuiz /></Layout>} />
      <Route path="/reader" element={<Layout><ReaderModeQuiz /></Layout>} />
      <Route path="/past-questions" element={<Layout><PastQuestionsQuiz /></Layout>} />

      {/* Study & Help */}
      <Route path="/study" element={<Layout><StudyHub /></Layout>} />
      <Route path="/help" element={<Layout><HelpCenter /></Layout>} />

      {/* Profile / Auth / Admin */}
      <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
      <Route path="/7351/admin" element={<Layout><AdminPage /></Layout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AuthProvider>
  );
}