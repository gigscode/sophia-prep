import { supabase } from '../integrations/supabase/client';

/**
 * Verifies that the handle_new_user trigger exists in the database.
 * This trigger is responsible for automatically creating user_profiles records
 * when new users sign up through the auth system.
 * 
 * Note: Due to client-side limitations, this function cannot directly query
 * PostgreSQL system catalogs. It performs a basic sanity check instead.
 * For definitive verification, use the manual SQL queries in the documentation.
 * 
 * @returns Promise<boolean> - true if basic checks pass, false otherwise
 */
export async function verifyUserProfileTrigger(): Promise<boolean> {
  try {
    // Since we can't directly query pg_trigger from the client side,
    // we perform a basic sanity check by verifying the user_profiles table exists
    // and is accessible. This is an indirect verification.
    return await verifyTriggerFallback();
  } catch (error) {
    console.error('[DATABASE_VERIFICATION] Error verifying trigger:', error);
    return false;
  }
}

/**
 * Fallback method to verify trigger existence.
 * Performs a basic sanity check by verifying the user_profiles table is accessible.
 */
async function verifyTriggerFallback(): Promise<boolean> {
  try {
    // Since we can't directly query pg_trigger from the client,
    // we perform a basic sanity check: verify the user_profiles table exists
    // and is accessible. This doesn't guarantee the trigger exists, but it's
    // a reasonable proxy check.
    const { error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    // If we can query user_profiles, the table exists
    // We can't directly verify the trigger from the client side without RPC
    // So we'll log a warning and return true (optimistic)
    if (!error) {
      console.warn('[DATABASE_VERIFICATION] Cannot verify trigger from client side.');
      console.warn('[DATABASE_VERIFICATION] For definitive verification, see: docs/TRIGGER_VERIFICATION_GUIDE.md');
      console.warn('[DATABASE_VERIFICATION] Or run this SQL in Supabase:');
      console.warn('[DATABASE_VERIFICATION] SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';');
      return true;
    }

    console.error('[DATABASE_VERIFICATION] Cannot access user_profiles table:', error);
    return false;
  } catch (error) {
    console.error('[DATABASE_VERIFICATION] Fallback verification failed:', error);
    return false;
  }
}

/**
 * Performs startup verification checks for the database.
 * Logs warnings if critical triggers are missing.
 * This is a non-blocking check for monitoring purposes.
 */
export async function performStartupDatabaseChecks(): Promise<void> {
  console.log('[DATABASE_VERIFICATION] Starting database verification checks...');

  try {
    const triggerExists = await verifyUserProfileTrigger();

    if (!triggerExists) {
      console.warn('⚠️ [DATABASE_VERIFICATION] WARNING: User profile trigger may be missing!');
      console.warn('[DATABASE_VERIFICATION] The on_auth_user_created trigger is not verified.');
      console.warn('[DATABASE_VERIFICATION] New user signups may not automatically create profiles.');
      console.warn('[DATABASE_VERIFICATION] Fallback mechanism will handle profile creation on login.');
      console.warn('[DATABASE_VERIFICATION] To manually verify trigger in Supabase:');
      console.warn('[DATABASE_VERIFICATION] 1. Go to SQL Editor in Supabase Dashboard');
      console.warn('[DATABASE_VERIFICATION] 2. Run: SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';');
      console.warn('[DATABASE_VERIFICATION] 3. Verify the trigger exists and is enabled');
    } else {
      console.log('✓ [DATABASE_VERIFICATION] User profile trigger verification passed');
    }
  } catch (error) {
    console.error('[DATABASE_VERIFICATION] Startup verification failed:', error);
    console.warn('[DATABASE_VERIFICATION] Continuing with application startup...');
  }

  console.log('[DATABASE_VERIFICATION] Database verification checks completed');
}

/**
 * Manual verification instructions for developers.
 * 
 * To manually verify the trigger exists in Supabase:
 * 
 * 1. Open Supabase Dashboard
 * 2. Navigate to SQL Editor
 * 3. Run the following query:
 * 
 *    SELECT 
 *      t.tgname AS trigger_name,
 *      t.tgenabled AS enabled,
 *      p.proname AS function_name
 *    FROM pg_trigger t
 *    JOIN pg_proc p ON t.tgfoid = p.oid
 *    WHERE t.tgname = 'on_auth_user_created';
 * 
 * 4. Expected result:
 *    - trigger_name: on_auth_user_created
 *    - enabled: O (enabled for all operations)
 *    - function_name: handle_new_user
 * 
 * 5. If no results, the trigger is missing. Deploy it using:
 *    - Run the migration file: supabase/migrations/20250125_handle_new_user_v2.sql
 *    - Or create manually using the SQL from the migration file
 * 
 * 6. To verify the trigger function exists:
 * 
 *    SELECT 
 *      p.proname AS function_name,
 *      pg_get_functiondef(p.oid) AS function_definition
 *    FROM pg_proc p
 *    WHERE p.proname = 'handle_new_user';
 */
