import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';

describe('FeatureCard', () => {
  const mockIcon = <svg data-testid="test-icon" />;
  let mockOnClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClick = vi.fn();
  });

  it('renders with title and icon', () => {
    render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with description when provided', () => {
    render(
      <FeatureCard
        title="Test Card"
        description="Test description"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button', { name: 'Test Card' });
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', () => {
    render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button', { name: 'Test Card' });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', () => {
    render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button', { name: 'Test Card' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct size classes for small size', () => {
    const { container } = render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
        size="small"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-4');
  });

  it('applies correct size classes for medium size', () => {
    const { container } = render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
        size="medium"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-5');
  });

  it('applies correct size classes for large size', () => {
    const { container } = render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
        size="large"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-6');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
        className="custom-class"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });

  it('has rounded corners (rounded-2xl class)', () => {
    const { container } = render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('rounded-2xl');
  });

  it('has hover effect classes', () => {
    const { container } = render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover:scale-[1.02]');
    expect(card.className).toContain('hover:shadow-lg');
  });

  it('has proper accessibility attributes', () => {
    render(
      <FeatureCard
        title="Test Card"
        icon={mockIcon}
        iconBackgroundColor="hsl(217, 91%, 60%)"
        onClick={mockOnClick}
      />
    );

    const card = screen.getByRole('button', { name: 'Test Card' });
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Test Card');
  });
});
