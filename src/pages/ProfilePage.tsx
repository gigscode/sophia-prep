import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="container mx-auto px-4 py-12">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-semibold text-blue-700">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name || user.email}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.isAdmin && (
              <div className="mt-2 inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">
                Admin
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-700">
          <p>You can update your profile details in your account settings.</p>
        </div>
      </div>
    </div>
  );
}
