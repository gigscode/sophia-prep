import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizModeCard } from './QuizModeCard';

describe('QuizModeCard', () => {
  const mockIcon = <svg data-testid="test-icon">Icon</svg>;

  it('renders with practice mode styling', () => {
    render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Test description"
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with cbt mode styling', () => {
    render(
      <QuizModeCard
        mode="cbt"
        icon={mockIcon}
        title="CBT Quiz"
        description="CBT description"
        onClick={() => {}}
      />
    );

    expect(screen.getByText('CBT Quiz')).toBeInTheDocument();
    expect(screen.getByText('CBT description')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Test description"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with Enter key', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Test description"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with Space key', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Test description"
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('includes icon, title, and description as required by Requirements 3.3', () => {
    render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Familiarize yourself with exam questions"
        onClick={() => {}}
      />
    );

    // Verify all required elements are present (Requirement 3.3)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    expect(screen.getByText('Familiarize yourself with exam questions')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Test description"
        onClick={() => {}}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Practice Mode: Test description');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <QuizModeCard
        mode="practice"
        icon={mockIcon}
        title="Practice Mode"
        description="Test description"
        onClick={() => {}}
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
