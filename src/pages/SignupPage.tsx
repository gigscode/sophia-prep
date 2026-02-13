import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { createFormPersistence } from '../utils/form-state-persistence';

export function SignupPage() {
  const { signup } = useAuth();
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state persistence
  const formPersistence = useMemo(() => createFormPersistence('signup'), []);

  // Load saved form state on component mount
  useEffect(() => {
    const savedState = formPersistence.restoreFormState();
    if (savedState) {
      if (savedState.name) setName(savedState.name);
      if (savedState.email) setEmail(savedState.email);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password, name);
      // Clear form state on successful signup
      formPersistence.clearFormState();
      navigate('/');
    } catch (err) {
      setError('Failed to sign up');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create an account</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">Full name</label>
          <input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              formPersistence.autoSaveFormState({ name: e.target.value, email });
            }}
            className="w-full p-2 border rounded mb-3"
          />

          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              formPersistence.autoSaveFormState({ name, email: e.target.value });
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

          <button className="w-full py-2 bg-blue-600 text-white rounded">Sign up</button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-blue-600">Log in</Link>
        </p>
      </div>
    </div>
  );
}
