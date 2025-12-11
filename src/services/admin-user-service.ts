import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

export type AdminUser = Database['public']['Tables']['user_profiles']['Row'];

export type UserUpdate = {
  email?: string;
  full_name?: string | null;
  subscription_plan?: string | null;
  last_login?: string | null;
  is_active?: boolean;
  exam_type?: 'JAMB' | 'WAEC' | 'BOTH' | null;
};

export type UserFilters = {
  search?: string;
  subscription?: string;
  status?: 'active' | 'suspended' | 'all';
  dateFrom?: string;
  dateTo?: string;
};

export class AdminUserService {
  async getAllUsers(filters?: UserFilters, page = 1, limit = 20): Promise<{ users: AdminUser[]; total: number }> {
    try {
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
      }

      if (filters?.subscription && filters.subscription !== 'all') {
        query = query.eq('subscription_plan', filters.subscription);
      }

      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'suspended') {
        query = query.eq('is_active', false);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        return { users: [], total: 0 };
      }

      return { users: (data as AdminUser[]) || [], total: count || 0 };
    } catch (err) {
      console.error('Failed to fetch users:', err);
      return { users: [], total: 0 };
    }
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return (data as AdminUser) || null;
    } catch (err) {
      console.error('Failed to fetch user:', err);
      return null;
    }
  }

  async updateUser(id: string, updates: UserUpdate): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('user_profiles') as any)
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating user:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to update user:', err);
      return false;
    }
  }

  async suspendUser(id: string): Promise<boolean> {
    return this.updateUser(id, { is_active: false });
  }

  async activateUser(id: string): Promise<boolean> {
    return this.updateUser(id, { is_active: true });
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete user:', err);
      return false;
    }
  }

  async exportUsersToCSV(filters?: UserFilters): Promise<string> {
    const { users } = await this.getAllUsers(filters, 1, 10000);

    const headers = ['ID', 'Email', 'Name', 'Subscription', 'Registration Date', 'Last Login', 'Status'];
    const rows = users.map(user => [
      user.id,
      user.email,
      user.full_name || '',
      user.subscription_plan || 'Free',
      user.created_at,
      user.last_login || 'Never',
      user.is_active ? 'Active' : 'Suspended',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    return csv;
  }
}

export const adminUserService = new AdminUserService();

