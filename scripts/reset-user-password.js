/**
 * Send password reset email to users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/reset-user-password.js <email>');
  console.error('Example: node scripts/reset-user-password.js sophiareignsacademy@gmail.com');
  process.exit(1);
}

async function sendPasswordReset() {
  console.log(`Sending password reset email to: ${email}\n`);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.VITE_APP_URL || 'http://localhost:7351'}/reset-password`,
  });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('✅ Password reset email sent!');
  console.log('   Check the email inbox for the reset link.');
  console.log('   The link will redirect to your app where you can set a new password.');
}

sendPasswordReset().catch(console.error);
