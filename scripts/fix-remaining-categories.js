import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRemainingCategories() {
  console.log('🔧 Fixing remaining subject categories...\n');

  const updates = [
    // Fix duplicates and miscategorized subjects
    { slug: 'english-language', category: 'LANGUAGE', name: 'English Language' },
    { slug: 'literature-in-english', category: 'ARTS', name: 'Literature in English' },
    { slug: 'crs-irs', category: 'ARTS', name: 'CRS/IRS' },
    { slug: 'agriculture', category: 'SCIENCE', name: 'Agriculture' },
    { slug: 'marketing', category: 'COMMERCIAL', name: 'Marketing' },
    { slug: 'music', category: 'ARTS', name: 'Music' },
  ];

  let totalUpdated = 0;

  for (const { slug, category, name } of updates) {
    const { data: existing, error: fetchError } = await supabase
      .from('subjects')
      .select('name, subject_category')
      .eq('slug', slug)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log(`  ⚠️  ${name} (${slug}): Not found (skipping)`);
      } else {
        console.error(`  ❌ ${name}: Error - ${fetchError.message}`);
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
      console.error(`  ❌ ${existing.name}: Failed - ${updateError.message}`);
    } else {
      console.log(`  ✅ ${existing.name}: Updated from ${existing.subject_category} to ${category}`);
      totalUpdated++;
    }
  }

  console.log(`\n✨ Done! Updated ${totalUpdated} subject(s).`);

  // Display final categorization
  console.log('\n📊 Final Subject Categories:\n');
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('name, slug, subject_category')
    .order('subject_category', { ascending: true })
    .order('name', { ascending: true });

  if (allSubjects) {
    const grouped = {};
    allSubjects.forEach(subject => {
      if (!grouped[subject.subject_category]) {
        grouped[subject.subject_category] = [];
      }
      grouped[subject.subject_category].push(subject);
    });

    Object.entries(grouped).forEach(([category, subjects]) => {
      console.log(`\n${category} (${subjects.length}):`);
      subjects.forEach(s => console.log(`  - ${s.name}`));
    });
  }
}

fixRemainingCategories().catch(console.error);
