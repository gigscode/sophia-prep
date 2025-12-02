/**
 * Check if specific users exist in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USERS_TO_CHECK = [
  'sophiareignsacademy@gmail.com',
  'reubensunday1220@gmail.com'
];

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

async function checkUsers() {
  console.log('Checking users in Supabase Auth...\n');
  
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  for (const emailToCheck of USERS_TO_CHECK) {
    const normalized = normalizeEmail(emailToCheck);
    const user = data.users.find(u => normalizeEmail(u.email || '') === normalized);
    
    if (user) {
      console.log(`✅ ${redactEmail(emailToCheck)}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    } else {
      console.log(`❌ ${redactEmail(emailToCheck)} - NOT FOUND`);
    }
    console.log('');
  }
}

checkUsers().catch(console.error);
