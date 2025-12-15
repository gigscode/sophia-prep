#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, slug')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Available subjects:');
  data.forEach(subject => {
    console.log(`- ${subject.name} (${subject.slug})`);
  });
}

checkSubjects();