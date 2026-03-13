-- ============================================================================
-- MAKE reubensunday1220@gmail.com A LIFETIME PAID USER
-- ============================================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This script:
-- 1. Updates the user_profiles table to set subscription_plan to 'Premium'
-- 2. Inserts or updates a lifetime subscription (expires year 2099)
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- 1. Get the user's ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'reubensunday1220@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User reubensunday1220@gmail.com not found in auth.users. Make sure they have registered first.';
  END IF;

  RAISE NOTICE 'Found user ID: %', v_user_id;

  -- 2. Update user_profiles to Premium
  UPDATE user_profiles
  SET
    subscription_plan = 'Premium',
    updated_at = NOW()
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    -- Profile doesn't exist yet, insert it
    INSERT INTO user_profiles (id, email, subscription_plan, is_active, created_at, updated_at)
    VALUES (v_user_id, 'reubensunday1220@gmail.com', 'Premium', true, NOW(), NOW());
    RAISE NOTICE 'Created new user_profile for user.';
  ELSE
    RAISE NOTICE 'Updated user_profile subscription_plan to Premium.';
  END IF;

  -- 3. Get or create a "Lifetime" subscription plan
  SELECT id INTO v_plan_id
  FROM subscription_plans
  WHERE slug = 'lifetime'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    -- Create a Lifetime plan if it doesn't exist
    INSERT INTO subscription_plans (
      plan_id,
      name,
      slug,
      description,
      amount,
      currency,
      interval,
      features,
      included_subjects,
      exam_type,
      bundle_type,
      is_active,
      sort_order
    ) VALUES (
      'lifetime',
      'Lifetime',
      'lifetime',
      'Lifetime access to all Sophia Prep features.',
      0,
      'NGN',
      'MONTHLY',
      ARRAY['Unlimited practice questions', 'All subjects', 'JAMB CBT simulation', 'Study materials', 'Priority support'],
      ARRAY['mathematics', 'english', 'physics', 'chemistry', 'biology', 'economics', 'government', 'literature'],
      'BOTH',
      'FULL_ACCESS',
      true,
      99
    )
    RETURNING id INTO v_plan_id;

    RAISE NOTICE 'Created new Lifetime subscription plan with ID: %', v_plan_id;
  ELSE
    RAISE NOTICE 'Using existing Lifetime plan with ID: %', v_plan_id;
  END IF;

  -- 4. Cancel any existing ACTIVE subscription for this user
  UPDATE user_subscriptions
  SET status = 'CANCELLED', updated_at = NOW()
  WHERE user_id = v_user_id AND status = 'ACTIVE';

  -- 5. Insert a lifetime subscription for the user
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    end_date,
    auto_renew,
    payment_reference,
    amount_paid,
    currency
  ) VALUES (
    v_user_id,
    v_plan_id,
    'ACTIVE',
    NOW(),
    '2099-12-31 23:59:59+00',  -- effectively lifetime
    false,
    'ADMIN-GRANT-LIFETIME-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    0,
    'NGN'
  );

  RAISE NOTICE '✅ SUCCESS: reubensunday1220@gmail.com has been granted a lifetime Premium subscription!';

END $$;

-- Verify the result
SELECT
  up.email,
  up.subscription_plan,
  us.status as subscription_status,
  sp.name as plan_name,
  us.start_date,
  us.end_date
FROM user_profiles up
LEFT JOIN user_subscriptions us ON up.id = us.user_id AND us.status = 'ACTIVE'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE up.email = 'reubensunday1220@gmail.com';
