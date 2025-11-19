/**
 * Script to verify subscription plans were seeded correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySubscriptionPlans() {
  try {
    console.log('🔍 Verifying subscription plans...\n');

    // Fetch all subscription plans
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('❌ Error fetching plans:', error.message);
      process.exit(1);
    }

    if (!plans || plans.length === 0) {
      console.error('❌ No subscription plans found in database');
      process.exit(1);
    }

    console.log('✅ Subscription Plans Verification');
    console.log('=====================================\n');

    // Expected plans
    const expectedPlans = [
      'jamb-only',
      'waec-only',
      'science-bundle',
      'commercial-bundle',
      'arts-bundle',
      'full-access'
    ];

    // Check if all expected plans exist
    const foundPlanIds = plans.map(p => p.plan_id);
    const missingPlans = expectedPlans.filter(id => !foundPlanIds.includes(id));

    if (missingPlans.length > 0) {
      console.error('❌ Missing plans:', missingPlans.join(', '));
      process.exit(1);
    }

    console.log(`✅ All ${expectedPlans.length} expected plans found\n`);

    // Display plan details
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Plan ID: ${plan.plan_id}`);
      console.log(`   Exam Type: ${plan.exam_type}`);
      console.log(`   Bundle Type: ${plan.bundle_type}`);
      console.log(`   Price: ₦${plan.amount.toLocaleString()} ${plan.currency}/${plan.interval}`);
      console.log(`   Subjects: ${plan.included_subjects.length} subjects`);
      console.log(`   Features: ${plan.features.length} features`);
      console.log(`   Active: ${plan.is_active ? '✅' : '❌'}`);
      console.log('');
    });

    // Verify pricing
    console.log('💰 Pricing Summary:');
    console.log('===================');
    console.log(`   JAMB Only: ₦${plans.find(p => p.plan_id === 'jamb-only')?.amount.toLocaleString()}`);
    console.log(`   WAEC Only: ₦${plans.find(p => p.plan_id === 'waec-only')?.amount.toLocaleString()}`);
    console.log(`   Science Bundle: ₦${plans.find(p => p.plan_id === 'science-bundle')?.amount.toLocaleString()}`);
    console.log(`   Commercial Bundle: ₦${plans.find(p => p.plan_id === 'commercial-bundle')?.amount.toLocaleString()}`);
    console.log(`   Arts Bundle: ₦${plans.find(p => p.plan_id === 'arts-bundle')?.amount.toLocaleString()}`);
    console.log(`   Full Access: ₦${plans.find(p => p.plan_id === 'full-access')?.amount.toLocaleString()}`);

    console.log('\n🎉 Subscription plans verification completed successfully!');
    console.log('✅ Task 1.7 - Seed initial subscription plans: COMPLETE');

  } catch (error) {
    console.error('❌ Error verifying subscription plans:', error);
    process.exit(1);
  }
}

// Run the verification
verifySubscriptionPlans();
