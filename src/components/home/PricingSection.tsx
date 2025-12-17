import { Check, Crown, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
  icon: React.ReactNode;
}

interface PricingSectionProps {
  isLoading?: boolean;
}

export function PricingSection({ isLoading = false }: PricingSectionProps) {
  const plans: PricingPlan[] = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '₦1,500',
      duration: 'per month',
      features: [
        'Access to all JAMB subjects',
      
      ],
      icon: <Calendar className="w-6 h-6" />
    },
    {
      id: 'quarterly',
      name: '3 Months Plan',
      price: '₦4,000',
      duration: 'for 3 months',
      features: [
        'Everything in Monthly Plan',
        'Save ₦500 compared to monthly',
       
      ],
      isPopular: true,
      icon: <Crown className="w-6 h-6" />
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[1, 2].map((i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get unlimited access to all JAMB preparation materials and practice tests
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative p-4 transition-all duration-300 hover:shadow-lg ${
              plan.isPopular
                ? 'border-2 border-[#B78628] bg-gradient-to-br from-[#FDF6E8] to-white'
                : plan.id === 'monthly'
                ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-500'
                : 'border border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#B78628] text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan Header - Compact */}
            <div className="text-center mb-4">
              {/* Icon and Title on same line */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                  plan.isPopular 
                    ? 'bg-[#B78628] text-white' 
                    : plan.id === 'monthly'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
              </div>
              
              {/* Price only */}
              <div className="text-center">
                <span className="text-3xl font-bold text-red-900">
                  {plan.price}
                </span>
              </div>
            </div>

            {/* Features List - Compact & Centered */}
            <div className="space-y-2 mb-4 text-center">
              {plan.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-start gap-2 justify-center">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-xs">
                    {feature}
                  </span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{plan.features.length - 3} more features
                </div>
              )}
            </div>

            {/* CTA Button - Compact */}
            <button
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                plan.isPopular
                  ? 'bg-[#B78628] text-white hover:bg-[#A67522]'
                  : plan.id === 'monthly'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Choose Plan
            </button>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
        <p>
          All plans include access to thousands of JAMB questions, detailed explanations, 
          and progress tracking. Cancel anytime.
        </p>
      </div>
    </div>
  );
}