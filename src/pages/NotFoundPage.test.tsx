import { render, screen } from '../test/test-utils';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 error message', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Sorry, we couldn\'t find the page you\'re looking for.')).toBeInTheDocument();
  });

  it('displays navigation options', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('shows suggestions based on URL path', () => {
    render(<NotFoundPage />, { initialPath: '/quiz/test' });

    expect(screen.getByText('Take a Quiz')).toBeInTheDocument();
  });
});