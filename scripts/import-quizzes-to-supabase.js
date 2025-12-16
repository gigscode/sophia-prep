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
  const qText = e.question_text || e.question || e.text || '';
  const opts = [e.option_a, e.option_b, e.option_c, e.option_d].map(o => (o == null ? '' : String(o)));
  const rawCorrect = (e.correct_answer || e.correct || e.answer || '').toString();

  const normalizeToKey = (val) => {
    if (!val) return '';
    const v = String(val).trim();
    if (/^[A-Za-z]$/.test(v)) return v.toUpperCase();
    if (/^[0-9]+$/.test(v)) {
      const idx = parseInt(v, 10) - 1;
      if (idx >= 0 && idx < opts.length) return String.fromCharCode(65 + idx);
    }
    const found = opts.findIndex(o => o && o.toString().trim().toLowerCase() === v.toLowerCase());
    if (found >= 0) return String.fromCharCode(65 + found);
    const m = v.match(/[A-Za-z]$/);
    if (m) {
      const letter = m[0].toUpperCase();
      const idx = letter.charCodeAt(0) - 65;
      if (idx >= 0 && idx < opts.length) return letter;
    }
    return '';
  };

  const correctKey = normalizeToKey(rawCorrect) || 'A';

  return {
    id: uuidv4(),
    subject: (e.topic && typeof e.topic === 'string') ? e.topic.toLowerCase() : (e.subject || null),
    topic: e.topic || null,
    question_text: qText,
    option_a: opts[0] || '',
    option_b: opts[1] || '',
    option_c: opts[2] || '',
    option_d: opts[3] || '',
    correct_answer: correctKey,
    explanation: e.explanation || '',
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
  const qText = e.question || e.question_text || e.text || '';
  const filled = [a, b, c, d].map(o => (o == null ? '' : String(o)));
  const rawCorrect = (e.answer || e.correct || e.correct_answer || '').toString();

  const normalizeToKey = (val) => {
    if (!val) return '';
    const v = String(val).trim();
    if (/^[A-Za-z]$/.test(v)) return v.toUpperCase();
    if (/^[0-9]+$/.test(v)) {
      const idx = parseInt(v, 10) - 1;
      if (idx >= 0 && idx < filled.length) return String.fromCharCode(65 + idx);
    }
    const found = filled.findIndex(o => o && o.toString().trim().toLowerCase() === v.toLowerCase());
    if (found >= 0) return String.fromCharCode(65 + found);
    const m = v.match(/[A-Za-z]$/);
    if (m) {
      const letter = m[0].toUpperCase();
      const idx = letter.charCodeAt(0) - 65;
      if (idx >= 0 && idx < filled.length) return letter;
    }
    return '';
  };

  const correctKey = normalizeToKey(rawCorrect) || 'A';

  return {
    id: e.id || uuidv4(),
    subject: (e.subject || '').toLowerCase(),
    topic: e.topic || null,
    question_text: qText,
    option_a: filled[0] || '',
    option_b: filled[1] || '',
    option_c: filled[2] || '',
    option_d: filled[3] || '',
    correct_answer: correctKey,
    explanation: e.explanation || '',
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
