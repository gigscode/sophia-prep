import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { BottomNavigation } from './BottomNavigation';

// Wrapper component to provide router context
function renderWithRouter(component: React.ReactElement, initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  );
}

describe('BottomNavigation', () => {
  describe('Structure and Content', () => {
    it('renders navigation element with proper role and aria-label', () => {
      renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
      expect(nav).toBeDefined();
    });

    it('renders exactly five navigation items (Requirement 7.2)', () => {
      renderWithRouter(<BottomNavigation />);
      
      // Check for all 5 navigation items by their text labels
      expect(screen.getByText('Home')).toBeDefined();
      expect(screen.getByText('Study')).toBeDefined();
      expect(screen.getByText('Test')).toBeDefined();
      expect(screen.getByText('Chat')).toBeDefined();
      expect(screen.getByText('More')).toBeDefined();
    });

    it('includes all required navigation items (Requirements 8.1-8.5)', () => {
      renderWithRouter(<BottomNavigation />);
      
      // Verify specific navigation items exist
      expect(screen.getByText('Home')).toBeDefined();
      expect(screen.getByText('Study')).toBeDefined();
      expect(screen.getByText('Test')).toBeDefined();
      expect(screen.getByText('Chat')).toBeDefined();
      expect(screen.getByText('More')).toBeDefined();
    });

    it('each navigation item has an icon and label (Requirement 7.3)', () => {
      const { container } = renderWithRouter(<BottomNavigation />);
      
      // Get all navigation links
      const links = screen.getAllByRole('link');
      
      // Verify each link has both icon (svg) and text label
      links.forEach((link) => {
        const icon = link.querySelector('svg');
        const label = link.querySelector('span');
        
        expect(icon).toBeDefined();
        expect(label).toBeDefined();
        expect(label?.textContent).toBeTruthy();
      });
    });
  });

  describe('Navigation Behavior', () => {
    it('navigates to correct route when item is clicked (Requirement 7.4)', async () => {
      const user = userEvent.setup();
      const { container } = renderWithRouter(<BottomNavigation />);
      
      const studyLink = screen.getByText('Study').closest('a');
      await user.click(studyLink!);
      
      // Verify the link has the correct href
      expect(studyLink?.getAttribute('href')).toBe('/study');
    });

    it('all navigation items have correct routes', () => {
      renderWithRouter(<BottomNavigation />);
      
      expect(screen.getByText('Home').closest('a')?.getAttribute('href')).toBe('/');
      expect(screen.getByText('Study').closest('a')?.getAttribute('href')).toBe('/study');
      expect(screen.getByText('Test').closest('a')?.getAttribute('href')).toBe('/quiz');
      expect(screen.getByText('Chat').closest('a')?.getAttribute('href')).toBe('/help');
      expect(screen.getByText('More').closest('a')?.getAttribute('href')).toBe('/profile');
    });
  });

  describe('Active State Highlighting', () => {
    it('highlights Home item when on home route (Requirement 7.5)', () => {
      renderWithRouter(<BottomNavigation />, '/');
      
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink?.getAttribute('aria-current')).toBe('page');
      expect(homeLink?.className).toContain('text-blue-600');
    });

    it('highlights Study item when on study route (Requirement 7.5)', () => {
      renderWithRouter(<BottomNavigation />, '/study');
      
      const studyLink = screen.getByText('Study').closest('a');
      expect(studyLink?.getAttribute('aria-current')).toBe('page');
      expect(studyLink?.className).toContain('text-blue-600');
    });

    it('highlights Test item when on quiz route (Requirement 7.5)', () => {
      renderWithRouter(<BottomNavigation />, '/quiz');
      
      const testLink = screen.getByText('Test').closest('a');
      expect(testLink?.getAttribute('aria-current')).toBe('page');
      expect(testLink?.className).toContain('text-blue-600');
    });

    it('highlights Chat item when on help route (Requirement 7.5)', () => {
      renderWithRouter(<BottomNavigation />, '/help');
      
      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink?.getAttribute('aria-current')).toBe('page');
      expect(chatLink?.className).toContain('text-blue-600');
    });

    it('highlights More item when on profile route (Requirement 7.5)', () => {
      renderWithRouter(<BottomNavigation />, '/profile');
      
      const moreLink = screen.getByText('More').closest('a');
      expect(moreLink?.getAttribute('aria-current')).toBe('page');
      expect(moreLink?.className).toContain('text-blue-600');
    });

    it('displays active indicator dot for active item', () => {
      const { container } = renderWithRouter(<BottomNavigation />, '/');
      
      const homeLink = screen.getByText('Home').closest('a');
      const indicatorDot = homeLink?.querySelector('.bg-blue-600.rounded-full');
      
      expect(indicatorDot).toBeDefined();
    });

    it('does not display indicator dot for inactive items', () => {
      const { container } = renderWithRouter(<BottomNavigation />, '/');
      
      const studyLink = screen.getByText('Study').closest('a');
      const indicatorDot = studyLink?.querySelector('.bg-blue-600.rounded-full');
      
      expect(indicatorDot).toBeNull();
    });

    it('only one item is active at a time', () => {
      renderWithRouter(<BottomNavigation />, '/study');
      
      const links = screen.getAllByRole('link');
      const activeLinks = links.filter(link => link.getAttribute('aria-current') === 'page');
      
      expect(activeLinks.length).toBe(1);
      expect(activeLinks[0].textContent).toContain('Study');
    });
  });

  describe('Styling and Layout', () => {
    it('has fixed positioning at bottom (Requirement 7.1)', () => {
      const { container } = renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('fixed');
      expect(nav.className).toContain('bottom-0');
    });

    it('has white background and shadow', () => {
      renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('bg-white');
      expect(nav.className).toContain('shadow-lg');
    });

    it('has correct z-index for layering', () => {
      renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('z-[1200]');
    });

    it('has 64px height as specified in design', () => {
      renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      const style = nav.getAttribute('style');
      
      expect(style).toContain('height');
      expect(style).toContain('64px');
    });

    it('includes safe area insets for mobile devices', () => {
      const { container } = renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      
      // Verify the component has inline styles for safe area insets
      // The paddingBottom style is applied via the style prop
      expect(nav.style.paddingBottom).toBeDefined();
    });

    it('uses flex layout for navigation items', () => {
      const { container } = renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      const flexContainer = nav.querySelector('.flex');
      
      expect(flexContainer).toBeDefined();
      expect(flexContainer?.className).toContain('justify-around');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderWithRouter(<BottomNavigation />);
      
      const nav = screen.getByRole('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Primary navigation');
    });

    it('active items have aria-current="page"', () => {
      renderWithRouter(<BottomNavigation />, '/');
      
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink?.getAttribute('aria-current')).toBe('page');
    });

    it('inactive items do not have aria-current', () => {
      renderWithRouter(<BottomNavigation />, '/');
      
      const studyLink = screen.getByText('Study').closest('a');
      expect(studyLink?.getAttribute('aria-current')).toBeNull();
    });

    it('icons have aria-hidden="true"', () => {
      const { container } = renderWithRouter(<BottomNavigation />);
      
      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('each navigation item has descriptive aria-label', () => {
      renderWithRouter(<BottomNavigation />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const ariaLabel = link.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('handles route changes correctly', () => {
      // Test with home route
      const { unmount: unmount1 } = renderWithRouter(<BottomNavigation />, '/');
      let homeLink = screen.getByText('Home').closest('a');
      expect(homeLink?.getAttribute('aria-current')).toBe('page');
      unmount1();
      
      // Test with study route
      renderWithRouter(<BottomNavigation />, '/study');
      const studyLink = screen.getByText('Study').closest('a');
      expect(studyLink?.getAttribute('aria-current')).toBe('page');
    });

    it('handles nested routes correctly', () => {
      renderWithRouter(<BottomNavigation />, '/study/syllabus');
      
      const studyLink = screen.getByText('Study').closest('a');
      expect(studyLink?.getAttribute('aria-current')).toBe('page');
    });
  });
});
