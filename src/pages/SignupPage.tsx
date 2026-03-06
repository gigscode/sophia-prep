import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, MailCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { createFormPersistence } from '../utils/form-state-persistence';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function SignupPage() {
  const { signup, resendVerification } = useAuth();
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupComplete, setSignupComplete] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Form state persistence
  const formPersistence = useMemo(() => createFormPersistence('signup'), []);

  // Load saved form state on component mount
  useEffect(() => {
    const savedState = formPersistence.restoreFormState();
    if (savedState) {
      if (savedState.name) setName(savedState.name);
      if (savedState.email) setEmail(savedState.email);
    }
  }, [formPersistence]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password, name);
      formPersistence.clearFormState();
      setPassword('');
      setError(null);
      setSignupComplete(true);
    } catch (err) {
      setError('Failed to sign up. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await resendVerification(email);
    } catch (err) {
      // Error handled by showToast in hook
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg min-h-[80vh] flex items-center justify-center">
      <Card className="w-full shadow-2xl border-blue-100 overflow-hidden animate-fade-in">
        {signupComplete ? (
          <div className="text-center py-8 px-4 animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-50 p-6 rounded-full">
                <MailCheck className="w-16 h-16 text-blue-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              We've sent a verification link to <br />
              <span className="font-semibold text-blue-600 break-all">{email}</span>
            </p>

            <div className="grid gap-4 mb-8">
              <Button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                Go to login <ArrowRight className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-2 py-4"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Resend verification email
                  </>
                )}
              </Button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 border border-gray-100 italic">
              "Psst! If you don't see it, please check your spam or junk folder."
            </div>
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
              <p className="text-gray-600">Join Sophia Prep and start your learning journey today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full name"
                placeholder="Enter your full name"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  formPersistence.autoSaveFormState({ name: e.target.value, email });
                }}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  formPersistence.autoSaveFormState({ name, email: e.target.value });
                }}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full py-4 text-lg mt-2">
                Sign up
              </Button>
            </form>

            <p className="text-center text-gray-600 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
