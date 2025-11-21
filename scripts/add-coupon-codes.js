#!/usr/bin/env node
/**
 * Add Coupon Codes
 * Uses service key to bypass RLS
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('📝 Adding coupon codes...\n');

  const coupons = [
    {
      code: 'WELCOME2025',
      description: 'Welcome discount for new users',
      discount_type: 'PERCENTAGE',
      discount_value: 20.00,
      max_uses: 1000,
      current_uses: 0,
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
      current_uses: 0,
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
      current_uses: 0,
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
      console.log(`✅ Added coupon: ${coupon.code} (${coupon.discount_value}${coupon.discount_type === 'PERCENTAGE' ? '%' : ' NGN'} off)`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);

