#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * 
 * This script checks if the required tables and columns exist
 * and provides fixes for common schema issues.
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

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking database schema...\n');

  // Check subscription_plans table
  console.log('📋 Checking subscription_plans table...');
  const subscriptionPlansExists = await checkTableExists('subscription_plans');
  
  if (!subscriptionPlansExists) {
    console.log('❌ subscription_plans table does not exist');
    console.log('💡 Solution: Run the schema.sql file in Supabase SQL Editor');
  } else {
    console.log('✅ subscription_plans table exists');
    
    // Check price_ngn column
    const priceNgnExists = await checkColumnExists('subscription_plans', 'price_ngn');
    if (!priceNgnExists) {
      console.log('❌ price_ngn column does not exist in subscription_plans');
      console.log('💡 Solution: Add the column with: ALTER TABLE subscription_plans ADD COLUMN price_ngn DECIMAL(10,2);');
    } else {
      console.log('✅ price_ngn column exists');
    }
  }

  console.log('');

  // Check questions table
  console.log('📋 Checking questions table...');
  const questionsExists = await checkTableExists('questions');
  
  if (!questionsExists) {
    console.log('❌ questions table does not exist');
    console.log('💡 Solution: Run the schema.sql file in Supabase SQL Editor');
  } else {
    console.log('✅ questions table exists');
    
    // Check exam_type column
    const examTypeExists = await checkColumnExists('questions', 'exam_type');
    if (!examTypeExists) {
      console.log('❌ exam_type column does not exist in questions');
      console.log('💡 Solution: Add the column with: ALTER TABLE questions ADD COLUMN exam_type TEXT CHECK (exam_type IN (\'JAMB\'));');
    } else {
      console.log('✅ exam_type column exists');
    }
  }

  console.log('');

  // Check user_subscriptions table
  console.log('📋 Checking user_subscriptions table...');
  const userSubscriptionsExists = await checkTableExists('user_subscriptions');
  
  if (!userSubscriptionsExists) {
    console.log('❌ user_subscriptions table does not exist');
    console.log('💡 Solution: Run the schema.sql file in Supabase SQL Editor');
  } else {
    console.log('✅ user_subscriptions table exists');
  }

  console.log('\n🏁 Schema check complete!');
  console.log('\nIf any tables or columns are missing, please:');
  console.log('1. Open Supabase Dashboard > SQL Editor');
  console.log('2. Run the supabase/schema.sql file');
  console.log('3. Or run the individual ALTER TABLE commands shown above');
}

main().catch(console.error);