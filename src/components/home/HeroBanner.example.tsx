import React from 'react';
import { HeroBanner } from './HeroBanner';
import { Sparkles, Zap, Trophy } from 'lucide-react';

/**
 * Example usage of the HeroBanner component
 * 
 * This file demonstrates various configurations of the HeroBanner component
 * with different gradient colors, icons, and content.
 */

export function HeroBannerExamples() {
  const handleSubscriptionClick = () => {
    console.log('Navigate to subscription page');
  };

  const handlePremiumClick = () => {
    console.log('Navigate to premium features');
  };

  const handleChallengeClick = () => {
    console.log('Navigate to challenge mode');
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        HeroBanner Component Examples
      </h1>

      {/* Example 1: Subscription Promotion with Icon */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          1. Subscription Promotion (with icon)
        </h2>
        <HeroBanner
          title="Unlock Premium Features"
          description="Get unlimited access to all past questions, video lessons, and personalized study plans. Start your journey to exam success today!"
          buttonText="Subscribe Now"
          buttonAction={handleSubscriptionClick}
          gradientColors={['#8B5CF6', '#6366F1']}
          icon={<Sparkles className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Example 2: Feature Highlight without Icon */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          2. Feature Highlight (no icon)
        </h2>
        <HeroBanner
          title="Master JAMB & WAEC with CBT Practice"
          description="Experience real exam conditions with our timed CBT simulator. Practice with thousands of past questions and track your progress."
          buttonText="Start Practicing"
          buttonAction={handlePremiumClick}
          gradientColors={['#10B981', '#059669']}
        />
      </div>

      {/* Example 3: Warm Gradient with Challenge */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          3. Challenge Mode (warm gradient)
        </h2>
        <HeroBanner
          title="Take the 30-Day Challenge"
          description="Commit to daily practice and watch your scores improve. Join thousands of students who have achieved their target scores."
          buttonText="Accept Challenge"
          buttonAction={handleChallengeClick}
          gradientColors={['#F97316', '#DC2626']}
          icon={<Trophy className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Example 4: Cool Blue Gradient */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          4. Study Hub Promotion (cool gradient)
        </h2>
        <HeroBanner
          title="Explore Our Study Hub"
          description="Access comprehensive study materials, video tutorials, and expert-curated content for all JAMB and WAEC subjects."
          buttonText="Browse Resources"
          buttonAction={() => console.log('Navigate to study hub')}
          gradientColors={['#3B82F6', '#1D4ED8']}
          icon={<Zap className="w-8 h-8 text-white" />}
        />
      </div>

      {/* Example 5: Dark Gradient */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          5. Premium Announcement (dark gradient)
        </h2>
        <HeroBanner
          title="New Features Available"
          description="We've added AI-powered study recommendations, performance analytics, and personalized learning paths to help you succeed."
          buttonText="Learn More"
          buttonAction={() => console.log('Navigate to features page')}
          gradientColors={['#1F2937', '#111827']}
        />
      </div>
    </div>
  );
}

export default HeroBannerExamples;
