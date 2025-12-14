#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env.local. Aborting.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function updateSubjectDescriptions() {
  console.log('Updating subject descriptions to remove JAMB/WAEC references...');

  try {
    // First, get all subjects to see what we're working with
    const { data: subjects, error: fetchError } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('Error fetching subjects:', fetchError);
      return;
    }

    console.log(`Found ${subjects.length} subjects to potentially update`);

    // Update subjects with new descriptions
    const updates = subjects.map(subject => {
      let newDescription = subject.description;

      // Remove practice references and JAMB/WAEC patterns
      if (newDescription) {
        newDescription = newDescription
          .replace(/practice and past questions \(JAMB\/WAEC\)/gi, 'for JAMB CBT exam')
          .replace(/practice and past questions \(JAMB\)/gi, 'for JAMB CBT exam')
          .replace(/\(JAMB\/WAEC\)/gi, '')
          .replace(/practice and past questions/gi, 'for JAMB CBT exam')
          .trim();
      }

      // If description doesn't end with "for JAMB CBT exam", make it consistent
      if (!newDescription || !newDescription.includes('for JAMB CBT exam')) {
        newDescription = `${subject.name} for JAMB CBT exam`;
      }

      return {
        ...subject,
        description: newDescription
      };
    });

    // Batch update all subjects
    const { data: updateData, error: updateError } = await supabase
      .from('subjects')
      .upsert(updates, { onConflict: 'id' })
      .select('id, name, description');

    if (updateError) {
      console.error('Error updating subjects:', updateError);
      return;
    }

    console.log(`Successfully updated ${updateData.length} subjects`);
    console.log('\nSample updated descriptions:');
    updateData.slice(0, 5).forEach(subject => {
      console.log(`- ${subject.name}: "${subject.description}"`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateSubjectDescriptions().catch(err => {
  console.error(err);
  process.exit(1);
});