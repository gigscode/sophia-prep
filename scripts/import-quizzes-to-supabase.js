#!/usr/bin/env node
/*
  Import local quiz JSON files into Supabase 'questions' table.

  Usage:
    SUPABASE_URL=https://... SUPABASE_SERVICE_KEY=your_service_role_key node scripts/import-quizzes-to-supabase.js

  Notes:
  - This script requires a Supabase service role key for upserting rows into protected tables.
  - It reads `data/jamb-waec-questions.json` and `data/extra-quizzes.json` and normalizes entries.
*/

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Set them in the environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

function loadJSON(filename) {
  const p = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function normalizeJambEntry(e) {
  return {
    id: uuidv4(),
    subject: (e.topic && typeof e.topic === 'string') ? e.topic.toLowerCase() : (e.subject || null),
    topic: e.topic || null,
    question_text: e.question_text || e.question || e.text || '',
    option_a: e.option_a || null,
    option_b: e.option_b || null,
    option_c: e.option_c || null,
    option_d: e.option_d || null,
    correct_answer: (e.correct_answer || e.correct || e.answer || '').toString(),
    explanation: e.explanation || '',
    difficulty_level: e.difficulty_level || null,
    exam_year: e.exam_year || null,
    exam_type: e.exam_type || null,
  };
}

function normalizeExtraEntry(e) {
  // extra-quizzes.json uses different shape: subject, question, choices, answer, explanation
  const opts = e.choices || [];
  const a = opts[0] || null;
  const b = opts[1] || null;
  const c = opts[2] || null;
  const d = opts[3] || null;
  return {
    id: e.id || uuidv4(),
    subject: (e.subject || '').toLowerCase(),
    topic: e.topic || null,
    question_text: e.question || e.question_text || e.text || '',
    option_a: a || null,
    option_b: b || null,
    option_c: c || null,
    option_d: d || null,
    correct_answer: (e.answer || e.correct || e.correct_answer || '').toString(),
    explanation: e.explanation || '',
    difficulty_level: e.difficulty_level || null,
    exam_year: e.exam_year || null,
    exam_type: e.exam_type || null,
  };
}

async function main() {
  console.log('Loading local question banks...');
  const jamb = loadJSON('data/jamb-waec-questions.json') || {};
  const extra = loadJSON('data/extra-quizzes.json') || [];

  const rows = [];

  // jamb is grouped by subject keys
  Object.keys(jamb).forEach((subjectKey) => {
    const arr = jamb[subjectKey];
    if (!Array.isArray(arr)) return;
    arr.forEach((e) => {
      const normalized = normalizeJambEntry({ ...e, subject: subjectKey });
      rows.push(normalized);
    });
  });

  // extras
  extra.forEach((e) => rows.push(normalizeExtraEntry(e)));

  console.log(`Prepared ${rows.length} rows to upsert into Supabase.`);

  // Upsert in batches to avoid payload size issues
  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    console.log(`Upserting rows ${i + 1}-${i + chunk.length}...`);
    const { data, error } = await supabase.from('questions').upsert(chunk, { onConflict: ['id'] });
    if (error) {
      console.error('Upsert error:', error);
      process.exit(1);
    }
  }

  console.log('Import completed successfully.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
