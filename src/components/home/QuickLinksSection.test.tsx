import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QuickLinksSection } from './QuickLinksSection';

// Wrapper component to provide router context
function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('QuickLinksSection', () => {
  it('renders section header with title', () => {
    renderWithRouter(<QuickLinksSection />);
    
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
  });

  it('renders at least four quick link cards (Requirement 4.5)', () => {
    renderWithRouter(<QuickLinksSection />);
    
    // Verify all four required cards are displayed
    expect(screen.getByText('Study Past Questions')).toBeInTheDocument();
    expect(screen.getByText('Video Lessons')).toBeInTheDocument();
    expect(screen.getByText('Novels')).toBeInTheDocument();
    expect(screen.getByText('Study Hub')).toBeInTheDocument();
  });

  it('includes Study Past Questions card (Requirement 5.1)', () => {
    renderWithRouter(<QuickLinksSection />);
    
    expect(screen.getByText('Study Past Questions')).toBeInTheDocument();
  });

  it('includes Video Lessons card (Requirement 5.2)', () => {
    renderWithRouter(<QuickLinksSection />);
    
    expect(screen.getByText('Video Lessons')).toBeInTheDocument();
  });

  it('includes Novels card (Requirement 5.3)', () => {
    renderWithRouter(<QuickLinksSection />);
    
    expect(screen.getByText('Novels')).toBeInTheDocument();
  });

  it('includes Study Hub card (Requirement 5.4)', () => {
    renderWithRouter(<QuickLinksSection />);
    
    expect(screen.getByText('Study Hub')).toBeInTheDocument();
  });

  it('renders expand action button when onExpandClick is provided', () => {
    const handleExpand = vi.fn();
    renderWithRouter(<QuickLinksSection onExpandClick={handleExpand} />);
    
    const actionButton = screen.getByLabelText('Section action');
    expect(actionButton).toBeInTheDocument();
  });

  it('does not render expand action button when onExpandClick is not provided', () => {
    renderWithRouter(<QuickLinksSection />);
    
    const actionButton = screen.queryByLabelText('Section action');
    expect(actionButton).not.toBeInTheDocument();
  });

  it('calls onExpandClick when action button is clicked', async () => {
    const handleExpand = vi.fn();
    const user = userEvent.setup();
    
    renderWithRouter(<QuickLinksSection onExpandClick={handleExpand} />);
    
    const actionButton = screen.getByLabelText('Section action');
    await user.click(actionButton);
    
    expect(handleExpand).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    const { container } = renderWithRouter(
      <QuickLinksSection className="custom-section-class" />
    );
    
    const section = container.querySelector('.custom-section-class');
    expect(section).toBeInTheDocument();
  });

  it('uses responsive grid layout (Requirement 4.2)', () => {
    const { container } = renderWithRouter(<QuickLinksSection />);
    
    // Check for grid classes
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('renders cards with icons and titles (Requirement 4.3)', () => {
    const { container } = renderWithRouter(<QuickLinksSection />);
    
    // Verify cards have both icons and titles
    const cards = container.querySelectorAll('[role="button"]');
    expect(cards.length).toBe(4);
    
    // Each card should have an icon (svg) and title text
    cards.forEach((card) => {
      const icon = card.querySelector('svg');
      const title = card.querySelector('h3');
      expect(icon).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });
  });
});
