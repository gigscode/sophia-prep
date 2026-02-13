import { supabase } from '../integrations/supabase/client';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  subscription_plans?: {
    id: string;
    name: string;
    description: string;
    price_ngn: number;
    duration_days: number;
    plan_code?: string; // Paystack plan code
  };
}

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
};

export const FORCED_LIMITS = {
  FREE_QUESTIONS_PER_SUBJECT: 20,
  PREMIUM_QUESTIONS_PER_SUBJECT: 45,
};

class SubscriptionService {
  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(userId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return false;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id, status, end_date')
        .eq('user_id', targetUserId)
        .eq('status', 'ACTIVE')
        .gte('end_date', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('Error checking subscription:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in hasActiveSubscription:', error);
      return false;
    }
  }

  /**
   * Get user's active subscription details
   */
  async getActiveSubscription(userId?: string): Promise<UserSubscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return null;

      // First, try the full query with subscription_plans join
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans!inner (
            name,
            description,
            price_ngn,
            duration_days
          )
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'ACTIVE')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active subscription found
          return null;
        }
        if (error.code === '42703' || error.message?.includes('does not exist')) {
          // Column or table does not exist - try fallback query
          console.warn('Subscription schema issue detected, using fallback query');

          // Fallback: query without the problematic join
          const fallbackResult = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('status', 'ACTIVE')
            .gte('end_date', new Date().toISOString())
            .order('end_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (fallbackResult.error) {
            console.error('Fallback subscription query also failed:', fallbackResult.error);
            return null;
          }

          // Return subscription without plan details
          return fallbackResult.data as UserSubscription | null;
        }
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as UserSubscription | null;
    } catch (error) {
      console.error('Error in getActiveSubscription:', error);
      return null;
    }
  }

  /**
   * Get all user subscriptions (active and past)
   */
  async getUserSubscriptions(userId?: string): Promise<UserSubscription[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            description,
            price_ngn,
            duration_days
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
      }

      return (data || []) as UserSubscription[];
    } catch (error) {
      console.error('Error in getUserSubscriptions:', error);
      return [];
    }
  }

  /**
   * Get days remaining in subscription
   */
  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Format subscription status for display
   */
  getStatusDisplay(status: string): { text: string; color: string } {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Active', color: 'text-green-600' };
      case 'EXPIRED':
        return { text: 'Expired', color: 'text-red-600' };
      case 'CANCELLED':
        return { text: 'Cancelled', color: 'text-gray-600' };
      default:
        return { text: status, color: 'text-gray-600' };
    }
  }

  /**
   * Get the current user's active plan name
   */
  async getActivePlan(): Promise<string> {
    const subscription = await this.getActiveSubscription();
    if (!subscription) return SUBSCRIPTION_PLANS.FREE;

    // Any active subscription that isn't explicitly 'free' is considered premium
    const planName = subscription.subscription_plans?.name?.toLowerCase();
    const planSlug = (subscription as any).subscription_plans?.slug?.toLowerCase();

    // Check both name and slug for 'free'
    if (planName === 'free' || planSlug === 'free') {
      return SUBSCRIPTION_PLANS.FREE;
    }

    return SUBSCRIPTION_PLANS.PREMIUM;
  }
}

export const subscriptionService = new SubscriptionService();
