import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { useLazyLoad } from '../hooks/useLazyLoad';
import { Header } from '../components/home/Header';
import { HeroBanner } from '../components/home/HeroBanner';
import { QuizModesSection } from '../components/home/QuizModesSection';
import { QuickLinksSection } from '../components/home/QuickLinksSection';
import { UpcomingEventsSection, EventData } from '../components/home/UpcomingEventsSection';
import { logPerformanceMetrics, markInteractive } from '../utils/performance';

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
  const { user } = useAuth();
  const { navigate } = useNavigation();

  // Lazy load refs for below-the-fold sections
  const [quickLinksRef, quickLinksVisible] = useLazyLoad<HTMLDivElement>({
    threshold: 0.01,
    rootMargin: '100px',
  });
  const [eventsRef, eventsVisible] = useLazyLoad<HTMLDivElement>({
    threshold: 0.01,
    rootMargin: '100px',
  });

  // Loading states for sections
  const [isQuickLinksLoading, setIsQuickLinksLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

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

  // Performance monitoring
  useEffect(() => {
    // Mark page as interactive
    markInteractive('HomePage');

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      logPerformanceMetrics();
    }
  }, []);

  // Simulate loading for Quick Links when visible
  useEffect(() => {
    if (quickLinksVisible) {
      // Simulate brief loading state
      const timer = setTimeout(() => {
        setIsQuickLinksLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [quickLinksVisible]);

  // Simulate loading for Events when visible
  useEffect(() => {
    if (eventsVisible) {
      // Simulate brief loading state
      const timer = setTimeout(() => {
        setIsEventsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [eventsVisible]);

  // Handler functions
  const handleCartClick = () => {
    // Cart functionality - navigate to profile for now until cart page is implemented
    navigate('/profile');
  };

  const handleNotificationClick = () => {
    // Notifications functionality - navigate to help center for now
    navigate('/help');
  };

  const handleHeroBannerAction = () => {
    // If user is logged in, go to subjects page
    // If not logged in, go to signup page
    if (user) {
      navigate('/subjects');
    } else {
      navigate('/signup');
    }
  };

  return (
    <Layout showNavbar={false} showFooter={false}>
      {/* Page Container with responsive padding and page transition animation */}
      <div
        className="
          min-h-screen
          page-padding
          pb-20
          mobile-no-overflow
          page-enter
        "
        style={{
          backgroundColor: 'hsl(var(--color-bg-page))',
        }}
      >
        {/* Header - Greeting and Action Icons */}
        <Header
          userName={user?.name}
          userEmail={user?.email}
          isLoggedIn={!!user}
          onCartClick={handleCartClick}
          onNotificationClick={handleNotificationClick}
          notificationCount={0}
        />

        {/* Main Content with Section Spacing (32px) and section reveal animations */}
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Hero Banner with section reveal animation */}
          <div className="section-reveal animate-delay-0">
            <HeroBanner
              title="Sophia Prep Exam Success"
              description="Your WAEC & JAMB success starts here — lifetime access for just ₦4,999."
              buttonText="Get Started"
              buttonAction={handleHeroBannerAction}
              gradientColors={['hsl(var(--color-primary-purple))', 'hsl(var(--color-primary-blue))']}
              icon={<Sparkles className="w-8 h-8 text-white" />}
            />
          </div>

          {/* Quiz Modes Section with section reveal animation */}
          <div className="section-reveal animate-delay-100">
            <QuizModesSection />
          </div>

          {/* Quick Links Section with lazy loading */}
          <div ref={quickLinksRef} className="section-reveal animate-delay-200">
            {quickLinksVisible && (
              <QuickLinksSection isLoading={isQuickLinksLoading} />
            )}
          </div>

          {/* Upcoming Events Section with lazy loading */}
          <div ref={eventsRef} className="section-reveal animate-delay-300">
            {eventsVisible && (
              <UpcomingEventsSection 
                events={upcomingEvents} 
                isLoading={isEventsLoading}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
