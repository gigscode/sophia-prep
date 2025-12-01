import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QuizModesSection } from './QuizModesSection';

// Wrapper component to provide router context
function renderWithRouter(component: React.ReactElement) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('QuizModesSection', () => {
  it('renders section header with title', () => {
    renderWithRouter(<QuizModesSection />);
    
    expect(screen.getByText('Quiz Modes')).toBeInTheDocument();
  });

  it('renders both Practice Mode and CBT Quiz cards (Requirement 3.2)', () => {
    renderWithRouter(<QuizModesSection />);
    
    // Verify both quiz modes are displayed
    expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    expect(screen.getByText(/CBT Quiz/)).toBeInTheDocument();
  });

  it('displays Practice Mode card with correct description', () => {
    renderWithRouter(<QuizModesSection />);
    
    expect(screen.getByText(/Familiarize yourself with exam questions/)).toBeInTheDocument();
  });

  it('displays CBT Quiz card with correct description', () => {
    renderWithRouter(<QuizModesSection />);
    
    expect(screen.getByText(/Timed past questions quiz/)).toBeInTheDocument();
  });

  it('renders expand action button when onExpandClick is provided', () => {
    const handleExpand = vi.fn();
    renderWithRouter(<QuizModesSection onExpandClick={handleExpand} />);
    
    const actionButton = screen.getByLabelText('Section action');
    expect(actionButton).toBeInTheDocument();
  });

  it('does not render expand action button when onExpandClick is not provided', () => {
    renderWithRouter(<QuizModesSection />);
    
    const actionButton = screen.queryByLabelText('Section action');
    expect(actionButton).not.toBeInTheDocument();
  });

  it('calls onExpandClick when action button is clicked', async () => {
    const handleExpand = vi.fn();
    const user = userEvent.setup();
    
    renderWithRouter(<QuizModesSection onExpandClick={handleExpand} />);
    
    const actionButton = screen.getByLabelText('Section action');
    await user.click(actionButton);
    
    expect(handleExpand).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    const { container } = renderWithRouter(
      <QuizModesSection className="custom-section-class" />
    );
    
    const section = container.querySelector('.custom-section-class');
    expect(section).toBeInTheDocument();
  });

  it('uses responsive grid layout', () => {
    const { container } = renderWithRouter(<QuizModesSection />);
    
    // Check for grid classes
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
  });
});
