import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../components/layout';
import { AuthProvider } from '../hooks/useAuth';

/**
 * Integration tests for BottomNavigation across all pages
 * 
 * Validates: Requirements 7.1 - Bottom navigation appears on all screens
 */

describe('BottomNavigation Integration', () => {
  const renderWithLayout = (children: React.ReactNode) => {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <Layout>{children}</Layout>
        </BrowserRouter>
      </AuthProvider>
    );
  };

  it('should render BottomNavigation by default in Layout', () => {
    renderWithLayout(<div>Test Page Content</div>);

    // Check for navigation element with aria-label
    const nav = screen.getByRole('navigation', { name: /primary navigation/i });
    expect(nav).toBeInTheDocument();

    // Check for all 5 navigation items by their visible text
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Study')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('should render page content along with BottomNavigation', () => {
    renderWithLayout(<div data-testid="page-content">Test Page Content</div>);

    // Both page content and navigation should be present
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
  });

  it('should allow hiding BottomNavigation when showBottomNav is false', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Layout showBottomNav={false}>
            <div>Test Page Content</div>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    );

    // Navigation should not be present
    expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    renderWithLayout(<div>Test Page Content</div>);

    // Check that all links have correct href attributes
    const homeLink = screen.getByText('Home').closest('a');
    const studyLink = screen.getByText('Study').closest('a');
    const testLink = screen.getByText('Test').closest('a');
    const chatLink = screen.getByText('Chat').closest('a');
    const moreLink = screen.getByText('More').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(studyLink).toHaveAttribute('href', '/study');
    expect(testLink).toHaveAttribute('href', '/quiz');
    expect(chatLink).toHaveAttribute('href', '/help');
    expect(moreLink).toHaveAttribute('href', '/profile');
  });

  it('should have fixed positioning for mobile access', () => {
    renderWithLayout(<div>Test Page Content</div>);

    const nav = screen.getByRole('navigation', { name: /primary navigation/i });
    
    // Check for fixed positioning class
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
  });
});
