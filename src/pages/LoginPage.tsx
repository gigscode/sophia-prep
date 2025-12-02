import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      // The useAuth hook already shows a toast with categorized error
      // We also display it in the form for better UX
      const errorMessage = err?.message || 'An unexpected error occurred. Please try again';
      
      // Map common Supabase errors to user-friendly messages
      if (errorMessage.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection');
      } else if (errorMessage.includes('database') || errorMessage.includes('relation')) {
        setError('System error. Please try again later');
      } else {
        setError('An unexpected error occurred. Please try again');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Log In</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
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

        <p className="text-sm text-gray-600 mt-4">
          Don't have an account? <Link to="/signup" className="text-blue-600">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
