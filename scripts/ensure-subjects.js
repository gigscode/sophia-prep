#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env.local. Aborting.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function loadJSON(p) {
  const full = path.resolve(process.cwd(), p);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function titleCase(s) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
  const jamb = loadJSON('data/jamb-questions.json') || {};
  const extra = loadJSON('data/extra-quizzes.json') || [];

  const slugs = new Set();
  // collect from jamb keys
  Object.keys(jamb).forEach(k => slugs.add(k.toLowerCase()));
  // collect from extra entries' subject field
  (extra || []).forEach(e => {
    if (e.subject) slugs.add(String(e.subject).toLowerCase());
  });

  const rows = [];
  let order = 1;
  for (const slug of Array.from(slugs).sort()) {
    if (!slug) continue;
    const name = titleCase(slug);
    rows.push({
      slug,
      name,
      description: `${name} for JAMB CBT exam`,
      exam_type: 'BOTH',
      subject_category: 'GENERAL',
      is_active: true,
      is_mandatory: false,
      sort_order: order++
    });
  }

  if (rows.length === 0) {
    console.log('No subjects found to upsert.');
    process.exit(0);
  }

  console.log(`Preparing to upsert ${rows.length} subjects...`);

  // Upsert using slug as conflict key
  const { data, error } = await supabase
    .from('subjects')
    .upsert(rows, { onConflict: ['slug'] })
    .select('id,slug,name');

  if (error) {
    console.error('Upsert error:', error.message || error);
    process.exit(1);
  }

  console.log(`Upserted ${Array.isArray(data) ? data.length : 0} subjects.`);
  console.log('Sample:', (data || []).slice(0,5).map(s => ({ id: s.id, slug: s.slug, name: s.name })) );
}

main().catch(err => { console.error(err); process.exit(1); });
