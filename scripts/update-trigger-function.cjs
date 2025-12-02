/**
 * Script to update the handle_new_user trigger function in schema.sql
 * Adds error handling and logging as per requirements
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

// Read the schema file
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// The new function (with error handling and logging)
const newFunction = `-- Function to handle new user creation (auto-create user_profiles)
-- Enhanced with error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt to create user profile with error handling
  BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, is_active, subscription_plan, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      true,
      'Free',
      NOW(),
      NOW()
    );
    
    -- Log successful profile creation
    RAISE NOTICE '[TRIGGER_PROFILE_CREATION] Successfully created profile for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, log and continue
      RAISE WARNING '[TRIGGER_PROFILE_CREATION] Profile already exists for user %', NEW.id;
    WHEN OTHERS THEN
      -- Log any other errors but don't block user signup
      RAISE WARNING '[TRIGGER_PROFILE_CREATION_FAILED] Failed to create profile for user %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  -- Always return NEW to allow auth.users insert to complete
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

// Use regex to find and replace the function
const functionRegex = /-- Function to handle new user creation[\s\S]*?FOR EACH ROW EXECUTE FUNCTION public\.handle_new_user\(\);/;

if (functionRegex.test(schemaContent)) {
  schemaContent = schemaContent.replace(functionRegex, newFunction);
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('✓ Successfully updated handle_new_user function in schema.sql');
  console.log('  - Added EXCEPTION block for error handling');
  console.log('  - Added RAISE NOTICE for successful creation');
  console.log('  - Added RAISE WARNING for errors');
  console.log('  - Added subscription_plan default value');
} else {
  console.log('✗ Could not find the function pattern in schema.sql');
  console.log('Attempting alternative approach...');
  
  // Try a simpler regex
  const simpleRegex = /CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)[\s\S]*?FOR EACH ROW EXECUTE FUNCTION public\.handle_new_user\(\);/;
  if (simpleRegex.test(schemaContent)) {
    const match = schemaContent.match(simpleRegex);
    console.log('Found function, replacing...');
    schemaContent = schemaContent.replace(simpleRegex, newFunction.substring(newFunction.indexOf('CREATE')));
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    console.log('✓ Successfully updated using alternative method');
  } else {
    console.log('✗ Could not find function with alternative method either');
  }
}
