import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSubjectCategories() {
  console.log('🔧 Fixing subject categories...\n');

  // Define correct categorizations
  const categories = {
    SCIENCE: ['physics', 'chemistry', 'biology', 'agricultural-science', 'further-mathematics', 'food-nutrition', 'food-and-nutrition'],
    COMMERCIAL: ['economics', 'commerce', 'accounting', 'business-studies'],
    ARTS: ['literature', 'government', 'history', 'crs', 'irs', 'geography'],
    LANGUAGE: ['english', 'french', 'yoruba', 'igbo', 'hausa'],
    GENERAL: ['mathematics', 'civic-education']
  };

  let totalUpdated = 0;

  for (const [category, slugs] of Object.entries(categories)) {
    console.log(`\n📚 Updating ${category} subjects...`);
    
    for (const slug of slugs) {
      const { data: existing, error: fetchError } = await supabase
        .from('subjects')
        .select('name, subject_category')
        .eq('slug', slug)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log(`  ⚠️  ${slug}: Not found (skipping)`);
        } else {
          console.error(`  ❌ ${slug}: Error fetching - ${fetchError.message}`);
        }
        continue;
      }

      if (existing.subject_category === category) {
        console.log(`  ✓ ${existing.name}: Already correct (${category})`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('subjects')
        .update({ subject_category: category })
        .eq('slug', slug);

      if (updateError) {
        console.error(`  ❌ ${existing.name}: Failed to update - ${updateError.message}`);
      } else {
        console.log(`  ✅ ${existing.name}: Updated from ${existing.subject_category} to ${category}`);
        totalUpdated++;
      }
    }
  }

  console.log(`\n\n✨ Done! Updated ${totalUpdated} subject(s).`);

  // Display current categorization
  console.log('\n📊 Current Subject Categories:\n');
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('name, slug, subject_category')
    .order('subject_category', { ascending: true })
    .order('name', { ascending: true });

  if (allSubjects) {
    let currentCategory = '';
    allSubjects.forEach(subject => {
      if (subject.subject_category !== currentCategory) {
        currentCategory = subject.subject_category;
        console.log(`\n${currentCategory}:`);
      }
      console.log(`  - ${subject.name} (${subject.slug})`);
    });
  }
}

fixSubjectCategories().catch(console.error);
