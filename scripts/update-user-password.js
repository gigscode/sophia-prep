/**
 * Update user password directly (requires service role key)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials (need service role key)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/update-user-password.js <email> <new-password>');
  console.error('Example: node scripts/update-user-password.js sophiareignsacademy@gmail.com MyNewPassword123!');
  console.error('\n⚠️  Password requirements:');
  console.error('   - At least 6 characters');
  console.error('   - Mix of letters and numbers recommended');
  process.exit(1);
}

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

function redactEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid]';
  const localPart = parts[0];
  const domain = parts[1];
  return localPart.length > 3 
    ? `${localPart.substring(0, 3)}***@${domain}`
    : `***@${domain}`;
}

async function updatePassword() {
  console.log(`Updating password for: ${redactEmail(email)}\n`);
  
  // First, find the user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }
  
  const normalized = normalizeEmail(email);
  const user = users.users.find(u => normalizeEmail(u.email || '') === normalized);
  
  if (!user) {
    console.error(`❌ User not found: ${redactEmail(email)}`);
    return;
  }
  
  console.log(`✅ User found: ${user.id}`);
  
  // Update the password
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error('❌ Error updating password:', error.message);
    return;
  }
  
  console.log('✅ Password updated successfully!');
  console.log(`   You can now log in with:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: [the password you just set]`);
}

updatePassword().catch(console.error);
