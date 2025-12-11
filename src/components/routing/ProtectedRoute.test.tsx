import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth');
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Mock LoadingSpinner component
vi.mock('../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner">Loading... ({size})</div>
  )
}));

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  it('shows loading spinner when auth is not initialized', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      initialized: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      initialized: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', isAdmin: false },
      loading: false,
      initialized: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('renders protected content when requireAuth is false', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      initialized: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute requireAuth={false}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows access denied for admin routes when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', isAdmin: false },
      loading: false,
      initialized: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute requireAdmin={true}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission to access this page.')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content for admin routes when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@example.com', isAdmin: true },
      loading: false,
      initialized: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute requireAdmin={true}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('shows access denied for admin routes when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      initialized: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn()
    });

    renderWithRouter(
      <ProtectedRoute requireAdmin={true}>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});