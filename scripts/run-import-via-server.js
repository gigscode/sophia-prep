#!/usr/bin/env node
/*
  Helper runner that calls local server admin-login and import-quizzes endpoints
  and prints only non-sensitive summaries (imported count).
  Usage: node scripts/run-import-via-server.js
*/
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SERVER = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4000}`;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function run() {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD not set in .env.local');
    process.exit(1);
  }

  try {
    const loginRes = await fetch(`${SERVER}/api/admin-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: ADMIN_PASSWORD }) });
    if (!loginRes.ok) {
      const txt = await loginRes.text();
      console.error('admin-login failed:', txt);
      process.exit(1);
    }
    const loginJson = await loginRes.json();
    const token = loginJson.token;
    // call import endpoint
    const impRes = await fetch(`${SERVER}/api/import-quizzes`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const impJson = await impRes.json().catch(() => ({}));
    if (!impRes.ok) {
      console.error('Import failed:', impJson.error || JSON.stringify(impJson));
      process.exit(1);
    }
    // print only summary
    console.log(JSON.stringify({ imported: impJson.imported || 0 }));
    process.exit(0);
  } catch (err) {
    console.error('Import runner error:', err.message || err);
    process.exit(1);
  }
}

run();
