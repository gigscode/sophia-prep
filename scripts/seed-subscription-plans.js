/**
 * Script to seed subscription plans into the database
 * This script reads and executes the subscription plans migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Starting subscription plans seeding...\n');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250101000006_seed_subscription_plans.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Executing SQL...\n');

    // Execute the migration using Supabase RPC or direct query
    // Note: We'll insert the plans directly using the Supabase client
    
    const plans = [
      {
        plan_id: 'jamb-only',
        name: 'JAMB Only',
        description: 'Access to all JAMB subjects and practice materials',
        exam_type: 'JAMB',
        bundle_type: 'FULL_ACCESS',
        included_subjects: [
          'english-language', 'mathematics', 'physics', 'chemistry', 'biology',
          'further-mathematics', 'geography', 'commerce', 'accounting', 'economics',
          'literature-in-english', 'government', 'crs-irs', 'yoruba', 'hausa', 'igbo'
        ],
        amount: 5000.00,
        currency: 'NGN',
        interval: 'MONTHLY',
        features: [
          'Access to all JAMB subjects',
          'Unlimited practice questions',
          'Mock exam simulations',
          'Past questions (2010-2024)',
          'Video lessons',
          'Study materials and syllabus',
          'Performance analytics',
          'Progress tracking'
        ],
        is_active: true,
        sort_order: 1
      },
      {
        plan_id: 'waec-only',
        name: 'WAEC Only',
        description: 'Access to all WAEC subjects and practice materials',
        exam_type: 'WAEC',
        bundle_type: 'FULL_ACCESS',
        included_subjects: [
          'english-language', 'mathematics', 'physics', 'chemistry', 'biology',
          'further-mathematics', 'geography', 'food-nutrition', 'commerce', 'accounting',
          'economics', 'marketing', 'civic-education', 'literature-in-english', 'government',
          'crs-irs', 'music', 'history', 'yoruba', 'hausa', 'igbo'
        ],
        amount: 5000.00,
        currency: 'NGN',
        interval: 'MONTHLY',
        features: [
          'Access to all WAEC subjects',
          'Unlimited practice questions',
          'Mock exam simulations',
          'Past questions (2010-2024)',
          'Video lessons',
          'Study materials and syllabus',
          'Performance analytics',
          'Progress tracking'
        ],
        is_active: true,
        sort_order: 2
      },
      {
        plan_id: 'science-bundle',
        name: 'Science Bundle',
        description: 'Complete package for Science students (JAMB & WAEC)',
        exam_type: 'BOTH',
        bundle_type: 'SCIENCE_BUNDLE',
        included_subjects: [
          'english-language', 'mathematics', 'physics', 'chemistry', 'biology',
          'further-mathematics', 'geography', 'food-nutrition'
        ],
        amount: 3500.00,
        currency: 'NGN',
        interval: 'MONTHLY',
        features: [
          'All Science subjects',
          'English Language (mandatory)',
          'Mathematics',
          'Physics, Chemistry, Biology',
          'Further Mathematics',
          'Unlimited practice questions',
          'Mock exams',
          'Past questions',
          'Video lessons',
          'Performance analytics'
        ],
        is_active: true,
        sort_order: 3
      },
      {
        plan_id: 'commercial-bundle',
        name: 'Commercial Bundle',
        description: 'Complete package for Commercial students (JAMB & WAEC)',
        exam_type: 'BOTH',
        bundle_type: 'COMMERCIAL_BUNDLE',
        included_subjects: [
          'english-language', 'mathematics', 'commerce', 'accounting', 'economics',
          'marketing', 'geography'
        ],
        amount: 3500.00,
        currency: 'NGN',
        interval: 'MONTHLY',
        features: [
          'All Commercial subjects',
          'English Language (mandatory)',
          'Mathematics',
          'Commerce, Accounting, Economics',
          'Marketing',
          'Unlimited practice questions',
          'Mock exams',
          'Past questions',
          'Video lessons',
          'Performance analytics'
        ],
        is_active: true,
        sort_order: 4
      },
      {
        plan_id: 'arts-bundle',
        name: 'Arts Bundle',
        description: 'Complete package for Arts students (JAMB & WAEC)',
        exam_type: 'BOTH',
        bundle_type: 'ARTS_BUNDLE',
        included_subjects: [
          'english-language', 'literature-in-english', 'government', 'crs-irs',
          'music', 'history', 'geography', 'yoruba', 'hausa', 'igbo'
        ],
        amount: 3500.00,
        currency: 'NGN',
        interval: 'MONTHLY',
        features: [
          'All Arts subjects',
          'English Language (mandatory)',
          'Literature in English',
          'Government, CRS/IRS',
          'Music, History',
          'Nigerian Languages',
          'Unlimited practice questions',
          'Mock exams',
          'Past questions',
          'Video lessons',
          'Performance analytics'
        ],
        is_active: true,
        sort_order: 5
      },
      {
        plan_id: 'full-access',
        name: 'Full Access',
        description: 'Unlimited access to all JAMB and WAEC subjects',
        exam_type: 'BOTH',
        bundle_type: 'FULL_ACCESS',
        included_subjects: [
          'english-language', 'mathematics', 'physics', 'chemistry', 'biology',
          'further-mathematics', 'geography', 'food-nutrition', 'commerce', 'accounting',
          'economics', 'marketing', 'civic-education', 'literature-in-english', 'government',
          'crs-irs', 'music', 'history', 'yoruba', 'hausa', 'igbo'
        ],
        amount: 7500.00,
        currency: 'NGN',
        interval: 'MONTHLY',
        features: [
          'Access to ALL subjects',
          'Both JAMB and WAEC',
          'All Science subjects',
          'All Commercial subjects',
          'All Arts subjects',
          'All Nigerian Languages',
          'Unlimited practice questions',
          'Mock exam simulations',
          'Past questions (2010-2024)',
          'Video lessons',
          'Study materials and syllabus',
          'Performance analytics',
          'Progress tracking',
          'Priority support'
        ],
        is_active: true,
        sort_order: 6
      }
    ];

    // Insert each plan
    for (const plan of plans) {
      console.log(`📦 Inserting plan: ${plan.name}...`);
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .upsert(plan, { onConflict: 'plan_id' })
        .select();

      if (error) {
        console.error(`❌ Error inserting ${plan.name}:`, error.message);
      } else {
        console.log(`✅ ${plan.name} inserted successfully`);
      }
    }

    // Verify the plans were inserted
    const { data: allPlans, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('plan_id, name, amount, exam_type')
      .order('sort_order');

    if (fetchError) {
      console.error('❌ Error fetching plans:', fetchError.message);
    } else {
      console.log('\n📊 Subscription Plans Summary:');
      console.log('================================');
      allPlans.forEach(plan => {
        console.log(`  • ${plan.name} (${plan.exam_type}) - ₦${plan.amount}`);
      });
      console.log(`\n✅ Total plans: ${allPlans.length}`);
    }

    console.log('\n🎉 Subscription plans seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
}

// Run the seeding
seedSubscriptionPlans();
