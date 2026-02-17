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
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

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
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) return null;

      // First, try the full query with subscription_plans join
      const { data, error } = await (supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            slug,
            description,
            price_ngn
          )
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'ACTIVE')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle() as any);

      if (error) {
        console.error('[GET_SUB_ERROR] Query failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === 'PGRST116') {
          // No active subscription found
          return null;
        }
        if (error.code === '42703' || error.message?.includes('does not exist') || error.code === '400') {
          // Column or table does not exist - try fallback query
          console.warn('Subscription schema issue detected, using fallback query');

          // Fallback: query without the problematic join
          const fallbackResult = await (supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('status', 'ACTIVE')
            .gte('end_date', new Date().toISOString())
            .order('end_date', { ascending: false })
            .limit(1)
            .maybeSingle() as any);

          if (fallbackResult.error) {
            console.error('[GET_SUB_FALLBACK_ERROR] Fallback query failed:', {
              code: fallbackResult.error.code,
              message: fallbackResult.error.message,
              details: fallbackResult.error.details,
              hint: fallbackResult.error.hint
            });
            return null;
          }

          // Return subscription without plan details
          return fallbackResult.data as UserSubscription | null;
        }
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
      let targetUserId = userId;

      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            slug,
            description,
            price_ngn
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
  async getActivePlan(userId?: string): Promise<string> {
    const subscription = await this.getActiveSubscription(userId);
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

  /**
   * Complete subscription update from client-side (fallback for webhook)
   */
  async completeSubscriptionClientSide(
    userId: string,
    plan: { name: string, slug: string, price: number },
    reference: string
  ): Promise<boolean> {
    try {
      console.log(`[CLIENT_SUB_UPDATE_INIT] user=${userId}, plan=${plan.slug}, ref=${reference}, price=${plan.price}`);

      // 1. Resolve plan_id
      let planId = null;
      const { data: planData, error: planError } = await (supabase
        .from('subscription_plans')
        .select('id')
        .eq('slug', plan.slug)
        .maybeSingle() as any);

      if (planError) {
        console.error('[CLIENT_SUB_UPDATE] Plan fetch error:', {
          code: planError.code,
          message: planError.message,
          details: planError.details
        });
      }
      if (planData) {
        planId = (planData as any).id;
        console.log(`[CLIENT_SUB_UPDATE] Resolved plan_id=${planId} for slug=${plan.slug}`);
      } else {
        console.warn(`[CLIENT_SUB_UPDATE] Could not resolve plan_id for slug=${plan.slug}`);
      }

      // 2. Update user profile to reflect the new plan
      const { error: profileError } = await (supabase
        .from('user_profiles')
        .update({
          subscription_plan: plan.name
        })
        .eq('id', userId) as any);

      if (profileError) {
        console.warn('[CLIENT_SUB_UPDATE] Profile update failed (may be RLS restricted):', profileError.message);
      }

      // 3. Insert into user_subscriptions
      const durationDays = plan.name.toLowerCase().includes('months') ? 90 : 30;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      if (!planId) {
        console.error('[CLIENT_SUB_UPDATE] Cannot insert subscription without a valid planId');
        return false;
      }

      const subPayload = {
        user_id: userId,
        plan_id: planId,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        amount_paid: plan.price,
        currency: 'NGN',
        payment_reference: reference,
        auto_renew: true
      };

      const { error: subError } = await (supabase
        .from('user_subscriptions')
        .insert(subPayload) as any);

      if (subError) {
        console.error('[CLIENT_SUB_UPDATE] Subscription record insertion failed:', {
          message: subError.message,
          details: subError.details,
          hint: subError.hint,
          code: subError.code,
          payload: subPayload
        });
        return false;
      }

      console.log('[CLIENT_SUB_UPDATE_SUCCESS] Subscription recorded client-side');
      return true;
    } catch (error) {
      console.error('[CLIENT_SUB_UPDATE_ERROR]', error);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();
