import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNavigation } from './BottomNavigation';

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

