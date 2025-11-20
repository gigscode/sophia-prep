#!/usr/bin/env node
/*
  Simple server to proxy Supabase operations and keep service keys server-side.
  Endpoints:
  - GET /api/questions?subject=<slug>&count=10   -> returns normalized questions for subject
  - GET /api/preview-import                     -> returns normalized rows from local data (dry-run)
  - POST /api/import-quizzes                    -> runs import upsert (protected by ADMIN_TOKEN)

  Environment variables required:
  - SUPABASE_URL
  - SUPABASE_SERVICE_KEY (service role key)
  - ADMIN_TOKEN (simple bearer token for admin operations)

  Start: `npm run server`
*/

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // used to mint admin JWT
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET; // secret to sign admin JWTs
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment. Server cannot start.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '5mb' }));

function loadJSON(filename) {
  const p = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
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

app.get('/api/preview-import', (req, res) => {
  const extra = loadJSON(path.join('data', 'extra-quizzes.json')) || [];
  const jamb = loadJSON(path.join('data', 'jamb-waec-questions.json')) || {};
  const rows = [];
  Object.keys(jamb).forEach(subjectKey => {
    const arr = jamb[subjectKey];
    if (!Array.isArray(arr)) return;
    arr.forEach(e => rows.push(normalizeJambEntry({ ...e, subject: subjectKey })));
  });
  extra.forEach(e => rows.push(normalizeExtraEntry(e)));
  res.json({ total: rows.length, sample: rows.slice(0, 10) });
});

// Fetch questions for a subject server-side to avoid exposing keys client-side
app.get('/api/questions', async (req, res) => {
  try {
    const { subject, count = 10 } = req.query;
    if (!subject) return res.status(400).json({ error: 'subject query param required' });

    // find subject id
    const { data: subjectRow, error: subErr } = await supabase
      .from('subjects')
      .select('id')
      .eq('slug', String(subject))
      .single();
    if (subErr || !subjectRow) return res.status(404).json({ error: 'subject not found' });

    const subjectId = subjectRow.id;
    const { data: topics } = await supabase.from('topics').select('id').eq('subject_id', subjectId);
    const topicIds = (topics || []).map(t => t.id);
    if (topicIds.length === 0) return res.json([]);

    const { data: questions } = await supabase
      .from('questions')
      .select('id,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,topic_id,exam_year,exam_type')
      .in('topic_id', topicIds)
      .limit(1000);

    // shuffle and slice
    const pool = (questions || []).map(q => ({ id: q.id, text: q.question_text, options: [q.option_a, q.option_b, q.option_c, q.option_d].map((t, i) => ({ key: String.fromCharCode(65 + i), text: t })), correct: q.correct_answer || '', explanation: q.explanation }));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const result = pool.slice(0, Number(count));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Protected import endpoint
app.post('/api/import-quizzes', async (req, res) => {
  // Protected: require Authorization: Bearer <admin-jwt>
  const auth = req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET || '');
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }

  try {
    const jamb = loadJSON(path.join('data', 'jamb-waec-questions.json')) || {};
    const extra = loadJSON(path.join('data', 'extra-quizzes.json')) || [];
    const rows = [];
    Object.keys(jamb).forEach(subjectKey => {
      const arr = jamb[subjectKey];
      if (!Array.isArray(arr)) return;
      arr.forEach(e => rows.push(normalizeJambEntry({ ...e, subject: subjectKey })));
    });
    extra.forEach(e => rows.push(normalizeExtraEntry(e)));

    // Resolve subjects and topics and prepare rows with topic_id
    const resolvedRows = [];
    for (const r of rows) {
      // find subject by slug
      let subjectRow = null;
      if (r.subject) {
        const { data: sdata } = await supabase.from('subjects').select('id,slug').eq('slug', r.subject).maybeSingle();
        subjectRow = sdata || null;
      }
      // Create subject if missing
      if (!subjectRow && r.subject) {
        const { data: newSub, error: subErr } = await supabase.from('subjects').insert({ name: r.subject, slug: r.subject, exam_type: r.exam_type || 'BOTH', subject_category: 'GENERAL', is_active: true }).select('id,slug').maybeSingle();
        subjectRow = newSub || null;
        if (subErr) {
          console.error('Failed to create subject', subErr.message || subErr);
        }
      }

      let topicId = null;
      if (subjectRow && r.topic) {
        // try find existing topic
        const { data: existing } = await supabase.from('topics').select('id').eq('subject_id', subjectRow.id).eq('name', r.topic).maybeSingle();
        if (existing && existing.id) {
          topicId = existing.id;
        } else {
          // create topic
          const { data: newTopic, error: tErr } = await supabase.from('topics').insert({ subject_id: subjectRow.id, name: r.topic, slug: r.topic.toLowerCase().replace(/\s+/g,'-'), description: `${r.topic} questions`, order_index: 0, is_active: true }).select('id').maybeSingle();
          if (newTopic && newTopic.id) topicId = newTopic.id;
          if (tErr) console.error('Failed to create topic', tErr.message || tErr);
        }
      }

      if (!topicId) {
        // skip row if we can't find or create a topic
        console.warn('Skipping question because topic_id could not be resolved', r.id, r.topic, r.subject);
        continue;
      }

      resolvedRows.push({
        topic_id: topicId,
        question_text: r.question_text,
        option_a: r.option_a,
        option_b: r.option_b,
        option_c: r.option_c,
        option_d: r.option_d,
        correct_answer: r.correct_answer,
        explanation: r.explanation,
        difficulty_level: r.difficulty_level,
        exam_year: r.exam_year,
        exam_type: r.exam_type,
        is_active: true
      });
    }

    // Batch upsert
    const batchSize = 200;
    for (let i = 0; i < resolvedRows.length; i += batchSize) {
      const chunk = resolvedRows.slice(i, i + batchSize);
      const { error } = await supabase.from('questions').insert(chunk);
      if (error) {
        console.error('Upsert error:', error);
        return res.status(500).json({ error: error.message || error });
      }
    }

    res.json({ status: 'ok', imported: resolvedRows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Admin login endpoint to mint short-lived JWTs using ADMIN_PASSWORD
app.post('/api/admin-login', (req, res) => {
  const { password } = req.body || {};
  if (!ADMIN_PASSWORD || !ADMIN_JWT_SECRET) return res.status(503).json({ error: 'admin auth not configured' });
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, expiresIn: 3600 });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Supabase proxy server listening on http://localhost:${port}`));
