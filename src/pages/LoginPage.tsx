import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createFormPersistence } from '../utils/form-state-persistence';

export function LoginPage() {
  const { login, user, loading } = useAuth();
  // const { navigate } = useNavigation(); // Copilot: unused
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state persistence
  const formPersistence = createFormPersistence('login');

  // Load saved form state on component mount
  useEffect(() => {
    const savedState = formPersistence.restoreFormState();
    if (savedState) {
      if (savedState.email) setEmail(savedState.email);
    }
  }, [formPersistence]);

  useEffect(() => {
    if (user && !loading) {
      // Clear form state on successful login
      formPersistence.clearFormState();
    }
  }, [user, loading, formPersistence]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      await login(email, password);
      // Navigation will be handled by the useEffect hook above
    } catch (err: unknown) {
      // The useAuth hook already shows categorized error messages via toast
      // We can optionally show a generic message here as well
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Log In</h2>

        {/* Show message if redirected from protected route */}
        {location.state?.message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{location.state.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              // Auto-save email (but not password for security)
              formPersistence.autoSaveFormState({ email: e.target.value });
            }}
            className="w-full p-2 border rounded mb-3"
            required
          />

          <label className="block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded mb-3"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="absolute right-2 top-2 text-gray-500"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && <div className="text-red-600 mb-3">{error}</div>}

          <button className="w-full py-2 bg-blue-600 text-white rounded">Log In</button>
        </form>

        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot your password?
          </Link>
        </div>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Don't have an account? <Link to="/signup" className="text-blue-600">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
