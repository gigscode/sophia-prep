import { User, Calendar, Newspaper, ShoppingBag, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';

interface MoreOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
}

const moreOptions: MoreOption[] = [
  {
    id: 'account',
    title: 'My Account',
    icon: User,
    route: '/profile',
    bgColor: 'bg-orange-50',
    iconBgColor: 'bg-orange-500',
    iconColor: 'text-white',
  },
  {
    id: 'events',
    title: 'Events',
    icon: Calendar,
    route: '/events',
    bgColor: 'bg-green-50',
    iconBgColor: 'bg-green-600',
    iconColor: 'text-white',
  },
  {
    id: 'news',
    title: 'News',
    icon: Newspaper,
    route: '/news',
    bgColor: 'bg-blue-50',
    iconBgColor: 'bg-purple-500',
    iconColor: 'text-white',
  },
  {
    id: 'store',
    title: 'Sophia Store',
    icon: ShoppingBag,
    route: '/store',
    bgColor: 'bg-yellow-50',
    iconBgColor: 'bg-green-700',
    iconColor: 'text-white',
  },
];

export function MorePage() {
  const { navigate } = useNavigation();
  const { user } = useAuth();

  // Create dynamic options array including admin option if user is admin
  const dynamicOptions = [...moreOptions];

  if (user?.isAdmin) {
    // Add admin option at the beginning
    dynamicOptions.unshift({
      id: 'admin',
      title: 'Admin Dashboard',
      icon: Shield,
      route: '/7351/admin',
      bgColor: 'bg-indigo-50',
      iconBgColor: 'bg-indigo-600',
      iconColor: 'text-white',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 m-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-8 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold text-white mb-2">Activate your device.</h1>
        <p className="text-4xl font-bold text-gray-900">₦2,000</p>
      </div>

      {/* Options Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dynamicOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => navigate(option.route)}
                className={`${option.bgColor} rounded-3xl p-8 flex flex-col items-center justify-center min-h-[240px] transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95`}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-8">{option.title}</h3>
                <div className={`${option.iconBgColor} w-20 h-20 rounded-full flex items-center justify-center shadow-md`}>
                  <Icon className={`w-10 h-10 ${option.iconColor}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
