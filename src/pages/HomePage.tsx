import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Layout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/home/Header';
import { HeroBanner } from '../components/home/HeroBanner';
import { QuizModesSection } from '../components/home/QuizModesSection';
import { QuickLinksSection } from '../components/home/QuickLinksSection';
import { UpcomingEventsSection, EventData } from '../components/home/UpcomingEventsSection';

/**
 * HomePage Component - Modern UI Redesign
 * 
 * Redesigned home page using the new component architecture with:
 * - Personalized Header with greeting
 * - Hero Banner for promotions
 * - Quiz Modes Section (Practice & CBT)
 * - Quick Links Section
 * - Upcoming Events Section
 * - Responsive spacing and padding
 * 
 * Requirements: All requirements integrated
 */
export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sample events data - in production, this would come from an API
  const upcomingEvents: EventData[] = [
    {
      id: '1',
      title: 'JAMB 2025 Registration Opens',
      date: new Date('2025-01-15'),
      description: 'Registration for JAMB UTME 2025 begins',
      type: 'announcement',
    },
    {
      id: '2',
      title: 'WAEC Exam Period',
      date: new Date('2025-05-20'),
      description: 'WAEC examinations commence',
      type: 'exam',
    },
    {
      id: '3',
      title: 'Mock Exam Deadline',
      date: new Date('2025-03-01'),
      description: 'Last day to register for mock exams',
      type: 'deadline',
    },
  ];

  // Handler functions
  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleHeroBannerAction = () => {
    navigate('/subscription');
  };

  return (
    <Layout showNavbar={false} showFooter={false}>
      {/* Page Container with responsive padding */}
      <div
        className="
          min-h-screen
          page-padding
          pb-20
          mobile-no-overflow
        "
        style={{
          backgroundColor: 'hsl(var(--color-bg-page))',
        }}
      >
        {/* Header - Greeting and Action Icons */}
        <Header
          userName={user?.name}
          isLoggedIn={!!user}
          onCartClick={handleCartClick}
          onNotificationClick={handleNotificationClick}
          notificationCount={0}
        />

        {/* Main Content with Section Spacing (32px) */}
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Hero Banner */}
          <HeroBanner
            title="Unlock Your Full Potential"
            description="Get lifetime access to all features, unlimited practice questions, and comprehensive study materials for just ₦1,500. Start your journey to exam success today!"
            buttonText="Get Started"
            buttonAction={handleHeroBannerAction}
            gradientColors={['hsl(var(--color-primary-purple))', 'hsl(var(--color-primary-blue))']}
            icon={<Sparkles className="w-8 h-8 text-white" />}
          />

          {/* Quiz Modes Section */}
          <QuizModesSection />

          {/* Quick Links Section */}
          <QuickLinksSection />

          {/* Upcoming Events Section */}
          <UpcomingEventsSection events={upcomingEvents} />
        </div>
      </div>
    </Layout>
  );
}
