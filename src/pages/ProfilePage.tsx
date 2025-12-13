import { useEffect, useState } from 'react';
import { User, BarChart3, Settings, Crown, Calendar, CreditCard, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { subscriptionService, UserSubscription } from '../services/subscription-service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function ProfilePage() {
  const { user, loading } = useAuth();
  const { navigate } = useNavigation();
  const [activeTab, setActiveTab] = useState<'profile' | 'analytics'>('profile');
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const activeSub = await subscriptionService.getActiveSubscription();
      setSubscription(activeSub);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-6">
      {/* Profile Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-semibold text-blue-700">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name || user.email}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.isAdmin && (
              <div className="mt-2 inline-block px-2 py-1 rounded text-xs" style={{ backgroundColor: '#F5EBCF', color: '#92400E' }}>
                Admin
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' ? (
        <div className="space-y-6">
          {/* Admin Dashboard Access Card - Only for Admin Users */}
          {user.isAdmin && (
            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Admin Dashboard</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage users, subjects, questions, and view analytics
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => navigate('/7351/admin')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700"
                >
                  Open Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )}

          {/* Subscription Status Card */}
          {loadingSubscription ? (
            <Card className="p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </Card>
          ) : subscription ? (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Premium Member</h3>
                    <p className="text-sm text-gray-600">{subscription.subscription_plans?.name}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Days Remaining</p>
                    <p className="font-bold text-gray-900">
                      {subscriptionService.getDaysRemaining(subscription.end_date)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Plan Price</p>
                    <p className="font-bold text-gray-900">
                      ₦{subscription.subscription_plans?.price_ngn.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Expires On</p>
                    <p className="font-bold text-gray-900">
                      {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.auto_renew && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✓ Auto-renewal is enabled. Your subscription will renew automatically.
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200">
              <div className="text-center py-6">
                <div className="inline-flex p-4 bg-orange-100 rounded-full mb-4">
                  <Crown className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Account</h3>
                <p className="text-gray-600 mb-6">
                  Upgrade to Premium to unlock all subjects, unlimited quizzes, and advanced features!
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/more')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-lg"
                >
                  Upgrade Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">✓ All Subjects</p>
                    <p className="text-xs text-gray-600">Access to JAMB subjects</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">✓ Unlimited Quizzes</p>
                    <p className="text-xs text-gray-600">Practice without limits</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">✓ Past Questions</p>
                    <p className="text-xs text-gray-600">2010-2024 questions</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Account Information Card */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{user.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <p className="text-gray-900">
                  {user.isAdmin ? 'Administrator' : subscription ? 'Premium Student' : 'Free Student'}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  To update your profile details, please contact support or use the account settings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <AnalyticsDashboard />
      )}
    </div>
  );
}
