#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    difficulty_level: e.difficulty_level || null,
    exam_year: e.exam_year || null,
    exam_type: e.exam_type || null,
  };
}

function normalizeExtraEntry(e) {
  const opts = e.choices || [];
  const filled = [opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || ''].map(o => (o == null ? '' : String(o)));
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
    question_text: e.question || e.question_text || e.text || '',
    option_a: filled[0] || '',
    option_b: filled[1] || '',
    option_c: filled[2] || '',
    option_d: filled[3] || '',
    correct_answer: correctKey,
    explanation: e.explanation || '',
    difficulty_level: e.difficulty_level || null,
    exam_year: e.exam_year || null,
    exam_type: e.exam_type || null,
  };
}

function run() {
  console.log('Dry-run: preparing normalized rows and printing example payloads (no network)');
  const jamb = loadJSON('data/jamb-waec-questions.json') || {};
  const extra = loadJSON('data/extra-quizzes.json') || [];
  const rows = [];

  Object.keys(jamb).forEach((subjectKey) => {
    const arr = jamb[subjectKey];
    if (!Array.isArray(arr)) return;
    arr.forEach((e) => rows.push(normalizeJambEntry({ ...e, subject: subjectKey })));
  });

  extra.forEach(e => rows.push(normalizeExtraEntry(e)));

  console.log(`Total rows prepared: ${rows.length}`);
  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    console.log(`\n--- Batch ${Math.floor(i / batchSize) + 1} (rows ${i + 1}-${i + chunk.length}) ---`);
    console.log(JSON.stringify(chunk.slice(0, 5), null, 2));
    if (chunk.length > 5) console.log(`... (${chunk.length - 5} more rows in this batch)`);
  }
}

run();
