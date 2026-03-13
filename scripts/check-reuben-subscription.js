import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const EMAIL = 'reubensunday1220@gmail.com';

async function checkStatus() {
  console.log(`🔍 Checking status for ${EMAIL}...\n`);

  // 1. Check user_profiles
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', EMAIL)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') {
      console.log(`❌ Profile: Not found`);
    } else {
      console.error(`❌ Profile Error: ${profileError.message}`);
    }
  } else {
    console.log(`✅ Profile: Found`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Plan: ${profile.subscription_plan}`);
    console.log(`   Active: ${profile.is_active}`);
    
    // 2. Check user_subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('*, plan:plan_id(*)')
      .eq('user_id', profile.id)
      .eq('status', 'ACTIVE');

    if (subsError) {
      console.error(`❌ Subscription Error: ${subsError.message}`);
    } else if (subscriptions && subscriptions.length > 0) {
      console.log(`\n✅ Active Subscriptions: ${subscriptions.length}`);
      subscriptions.forEach((sub, i) => {
        console.log(`   ${i + 1}. Plan: ${sub.plan?.name || sub.plan_id}`);
        console.log(`      Start: ${new Date(sub.start_date).toLocaleDateString()}`);
        console.log(`      End: ${new Date(sub.end_date).toLocaleDateString()}`);
        console.log(`      Status: ${sub.status}`);
      });
    } else {
      console.log(`\n❌ Active Subscriptions: None found`);
    }
  }
}

checkStatus().catch(console.error);
