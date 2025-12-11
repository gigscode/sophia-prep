import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNavigation } from './BottomNavigation';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  showBottomNav?: boolean;
}

export function Layout({
  children,
  showNavbar = true,
  showFooter = true,
  showBottomNav = true
}: LayoutProps) {
  const location = useLocation();
  const { clearNavigationError, navigationError } = useNavigation();
  const { initialized } = useAuth();

  // Clear navigation errors when location changes
  useEffect(() => {
    if (navigationError) {
      clearNavigationError();
    }
  }, [location.pathname, navigationError, clearNavigationError]);

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && <Navbar />}
      <main className="flex-1 pb-20 md:pb-0 animate-fade-in transition-smooth">
        {children}
      </main>
      {showFooter && <Footer />}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}

