#!/usr/bin/env node
/**
 * Fix Missing Data
 * Adds missing coupon codes and verifies user_subscriptions table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addCouponCodes() {
  console.log('📝 Adding coupon codes...\n');

  const coupons = [
    {
      code: 'WELCOME2025',
      description: 'Welcome discount for new users',
      discount_type: 'PERCENTAGE',
      discount_value: 20.00,
      max_uses: 1000,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    },
    {
      code: 'EARLYBIRD',
      description: 'Early bird special',
      discount_type: 'PERCENTAGE',
      discount_value: 15.00,
      max_uses: 500,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    },
    {
      code: 'STUDENT50',
      description: 'Student discount',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 500.00,
      max_uses: null,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    }
  ];

  for (const coupon of coupons) {
    const { data, error } = await supabase
      .from('coupon_codes')
      .upsert(coupon, { onConflict: 'code' })
      .select();

    if (error) {
      console.log(`❌ Error adding ${coupon.code}:`, error.message);
    } else {
      console.log(`✅ Added coupon: ${coupon.code}`);
    }
  }
}

async function checkUserSubscriptions() {
  console.log('\n🔍 Checking user_subscriptions table...\n');

  // Try with service key if available
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (serviceKey) {
    const adminSupabase = createClient(SUPABASE_URL, serviceKey);
    const { count, error } = await adminSupabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ user_subscriptions error: ${error.message}`);
      console.log('⚠️  This might be due to RLS policies. Table exists but requires authentication.');
    } else {
      console.log(`✅ user_subscriptions: ${count} records`);
    }
  } else {
    console.log('⚠️  No service key available. Skipping user_subscriptions check.');
    console.log('   (This table requires authentication due to RLS policies)');
  }
}

async function main() {
  console.log('🔧 Fixing missing data...\n');

  await addCouponCodes();
  await checkUserSubscriptions();

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

