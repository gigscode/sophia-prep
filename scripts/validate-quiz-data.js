#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

function loadJSON(filename) {
  const p = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function normalizeExtraEntry(e) {
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
    exam_year: e.exam_year || null,
    exam_type: e.exam_type || null,
  };
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
    exam_year: e.exam_year || null,
    exam_type: e.exam_type || null,
  };
}

function validateRow(r) {
  const problems = [];
  if (!r.question_text || r.question_text.trim().length === 0) problems.push('missing question_text');
  const opts = [r.option_a, r.option_b, r.option_c, r.option_d].filter(Boolean);
  if (opts.length < 2) problems.push('fewer than 2 options');
  if (!r.correct_answer || r.correct_answer.trim().length === 0) problems.push('missing correct_answer');
  return problems;
}

function run() {
  console.log('Validating quiz data...');
  const extra = loadJSON('data/extra-quizzes.json') || [];
  const jamb = loadJSON('data/jamb-waec-questions.json') || {};

  const normalized = [];

  extra.forEach((e, i) => {
    const n = normalizeExtraEntry(e);
    const problems = validateRow(n);
    normalized.push({ source: 'extra', index: i, id: n.id, problems, row: n });
  });

  Object.keys(jamb).forEach((key) => {
    const arr = jamb[key];
    if (!Array.isArray(arr)) return;
    arr.forEach((e, i) => {
      const n = normalizeJambEntry({ ...e, subject: key });
      const problems = validateRow(n);
      normalized.push({ source: 'jamb', index: i, id: n.id, problems, row: n });
    });
  });

  const issues = normalized.filter(x => x.problems.length > 0);
  console.log(`Total entries checked: ${normalized.length}`);
  console.log(`Entries with problems: ${issues.length}`);
  if (issues.length > 0) {
    issues.slice(0, 50).forEach(it => {
      console.log('---');
      console.log(`source: ${it.source} index:${it.index} id:${it.id}`);
      console.log('problems:', it.problems.join(', '));
      console.log('question_text:', it.row.question_text.slice(0, 200));
      console.log('options:', [it.row.option_a, it.row.option_b, it.row.option_c, it.row.option_d]);
      console.log('correct_answer:', it.row.correct_answer);
    });
  } else {
    console.log('No problems detected in normalization checks.');
  }
}

run();
