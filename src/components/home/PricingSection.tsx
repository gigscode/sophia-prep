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
            className={`relative p-6 transition-all duration-300 hover:shadow-lg ${
              plan.isPopular
                ? 'border-2 border-[#B78628] bg-gradient-to-br from-[#FDF6E8] to-white'
                : 'border border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#B78628] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                plan.isPopular ? 'bg-[#B78628] text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {plan.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600 ml-2">
                  {plan.duration}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.isPopular
                  ? 'bg-[#B78628] text-white hover:bg-[#A67522]'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Choose {plan.name}
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