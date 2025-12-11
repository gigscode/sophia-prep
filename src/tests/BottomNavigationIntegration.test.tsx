import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout';
import { AuthProvider } from '../hooks/useAuth';
import { UnifiedNavigationProvider } from '../components/navigation/UnifiedNavigationProvider';

// Mock Supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    }
  }
}));

/**
 * Integration tests for BottomNavigation across all pages
 * 
 * Validates: Requirements 7.1 - Bottom navigation appears on all screens
 */

describe('BottomNavigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithLayout = (children: React.ReactNode) => {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <UnifiedNavigationProvider enableDebugMode={false}>
            <Layout>{children}</Layout>
          </UnifiedNavigationProvider>
        </BrowserRouter>
      </AuthProvider>
    );
  };

  it('should render BottomNavigation by default in Layout', async () => {
    renderWithLayout(<div>Test Page Content</div>);

    // Wait for auth to initialize
    await screen.findByText('Test Page Content');

    // Check for navigation element with aria-label
    const nav = screen.getByRole('navigation', { name: /primary navigation/i });
    expect(nav).toBeInTheDocument();

    // Check for all 5 navigation items by their visible text in the bottom navigation
    const bottomNavItems = screen.getAllByText('Home');
    expect(bottomNavItems.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Subjects').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CBT Exam').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Study').length).toBeGreaterThan(0);
    expect(screen.getAllByText('More').length).toBeGreaterThan(0);
  });

  it('should render page content along with BottomNavigation', async () => {
    renderWithLayout(<div data-testid="page-content">Test Page Content</div>);

    // Wait for auth to initialize and content to render
    await screen.findByTestId('page-content');

    // Both page content and navigation should be present
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
  });

  it('should allow hiding BottomNavigation when showBottomNav is false', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <UnifiedNavigationProvider enableDebugMode={false}>
            <Layout showBottomNav={false}>
              <div>Test Page Content</div>
            </Layout>
          </UnifiedNavigationProvider>
        </BrowserRouter>
      </AuthProvider>
    );

    // Wait for auth to initialize
    await screen.findByText('Test Page Content');

    // Navigation should not be present
    expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument();
  });

  it('should have correct navigation links', async () => {
    renderWithLayout(<div>Test Page Content</div>);

    // Wait for auth to initialize
    await screen.findByText('Test Page Content');

    // Check that all navigation buttons exist and have correct functionality
    const bottomNav = screen.getByRole('navigation', { name: /primary navigation/i });
    
    // Get buttons within the bottom navigation specifically
    const homeButton = bottomNav.querySelector('button[aria-label*="Home"]');
    const subjectsButton = bottomNav.querySelector('button[aria-label*="Subjects"]');
    const cbtButton = bottomNav.querySelector('button[aria-label*="CBT Exam"]');
    const studyButton = bottomNav.querySelector('button[aria-label*="Study"]');
    const moreButton = bottomNav.querySelector('button[aria-label*="More"]');

    expect(homeButton).toBeInTheDocument();
    expect(subjectsButton).toBeInTheDocument();
    expect(cbtButton).toBeInTheDocument();
    expect(studyButton).toBeInTheDocument();
    expect(moreButton).toBeInTheDocument();
  });

  it('should have fixed positioning for mobile access', async () => {
    renderWithLayout(<div>Test Page Content</div>);

    // Wait for auth to initialize
    await screen.findByText('Test Page Content');

    const nav = screen.getByRole('navigation', { name: /primary navigation/i });
    
    // Check for fixed positioning class
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
  });
});
