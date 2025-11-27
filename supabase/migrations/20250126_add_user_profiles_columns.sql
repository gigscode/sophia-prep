-- ============================================================================
-- Migration: Add missing columns to user_profiles table
-- ============================================================================
-- Date: 2025-01-26
-- Description: Add last_login and subscription_plan columns to user_profiles
--              to fix 400 Bad Request errors from analytics queries

-- Add last_login column to track when user last logged in
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add subscription_plan column to track user's subscription tier
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'Free';

-- Create index on last_login for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);

-- Create index on subscription_plan for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles(subscription_plan);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- AND column_name IN ('last_login', 'subscription_plan');
