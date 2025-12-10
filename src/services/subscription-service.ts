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
    name: string;
    description: string;
    price_ngn: number;
    duration_days: number;
  };
}

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
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as any;
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

      return (data || []) as any[];
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
}

export const subscriptionService = new SubscriptionService();
