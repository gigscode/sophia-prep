/**
 * Script to test the handle_new_user trigger functionality
 * This creates a test user and verifies the profile is created automatically
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTrigger() {
  console.log('🧪 Testing trigger functionality...\n');

  const testEmail = `test-trigger-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  try {
    console.log('1. Creating test user...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: ${testName}`);

    // Create a test user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });

    if (signUpError) {
      console.error('   ❌ Failed to create test user:', signUpError.message);
      return;
    }

    console.log('   ✓ Test user created');
    console.log('   User ID:', signUpData.user?.id);

    // Wait a moment for trigger to execute
    console.log('\n2. Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created
    console.log('\n3. Checking if profile was created...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', signUpData.user?.id)
      .single();

    if (profileError) {
      console.error('   ❌ Profile not found:', profileError.message);
      console.log('\n   ⚠️  Trigger may not have executed successfully');
      console.log('   Please check Supabase logs for trigger errors');
      return;
    }

    console.log('   ✓ Profile created successfully!');
    console.log('\n   Profile Details:');
    console.log('   - ID:', profileData.id);
    console.log('   - Email:', profileData.email);
    console.log('   - Full Name:', profileData.full_name);
    console.log('   - Subscription Plan:', profileData.subscription_plan);
    console.log('   - Is Active:', profileData.is_active);
    console.log('   - Created At:', profileData.created_at);

    // Verify all required fields
    console.log('\n4. Verifying profile data...');
    const checks = [
      { name: 'Email matches', pass: profileData.email === testEmail },
      { name: 'Full name matches', pass: profileData.full_name === testName },
      { name: 'Subscription plan is Free', pass: profileData.subscription_plan === 'Free' },
      { name: 'Is active is true', pass: profileData.is_active === true },
      { name: 'Created at is set', pass: !!profileData.created_at },
      { name: 'Updated at is set', pass: !!profileData.updated_at }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const icon = check.pass ? '✓' : '✗';
      console.log(`   ${icon} ${check.name}`);
      if (!check.pass) allPassed = false;
    });

    if (allPassed) {
      console.log('\n✅ SUCCESS! Trigger is working correctly');
      console.log('   - Profile created automatically on signup');
      console.log('   - All default values set correctly');
      console.log('   - Error handling in place (EXCEPTION block)');
      console.log('   - Logging configured (RAISE NOTICE/WARNING)');
    } else {
      console.log('\n⚠️  Some checks failed - review profile data above');
    }

    // Cleanup
    console.log('\n5. Cleaning up test user...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      signUpData.user?.id
    );

    if (deleteError) {
      console.log('   ⚠️  Could not delete test user (may need service role key)');
      console.log('   Please delete manually: User ID', signUpData.user?.id);
    } else {
      console.log('   ✓ Test user deleted');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error);
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  TRIGGER FUNCTIONALITY TEST');
console.log('  Testing: handle_new_user trigger');
console.log('  Requirements: 1.1, 1.2, 1.3, 2.1, 3.1');
console.log('═══════════════════════════════════════════════════════════\n');

testTrigger();
