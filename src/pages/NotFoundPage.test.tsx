import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotFoundPage', () => {
  it('renders 404 error message', () => {
    renderWithRouter(<NotFoundPage />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText('Sorry, we couldn\'t find the page you\'re looking for.')).toBeInTheDocument();
  });

  it('displays navigation options', () => {
    renderWithRouter(<NotFoundPage />);

    expect(screen.getByText('Go Back')).toBeInTheDocument();
    expect(screen.getByText('Go to Home')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('shows suggestions based on URL path', () => {
    // Mock location pathname
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/quiz/test'
      },
      writable: true
    });

    renderWithRouter(<NotFoundPage />);

    expect(screen.getByText('Take a Quiz')).toBeInTheDocument();
  });
});