# Sophia Prep - Database Setup Guide

**Version:** 1.0.0  
**Date:** 2025-01-21  
**Strategy:** Fresh schema creation (no migrations)

---

## Prerequisites

1. **Supabase Account**: Create account at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project or use existing one
3. **Project Credentials**: Note your project URL and anon/service keys

---

## Step 1: Configure Environment Variables

Create or update `.env.local` in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server Configuration (for Express proxy)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
PORT=3001
```

**Where to find these:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings > API
4. Copy URL and keys

---

## Step 2: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. **Open SQL Editor**
   - Go to Supabase Dashboard
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Run Schema File**
   - Open `supabase/schema.sql` from this project
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" or press `Ctrl+Enter`

3. **Verify Success**
   - Check for "Success. No rows returned" message
   - No error messages should appear

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run schema
supabase db push --file supabase/schema.sql
```

---

## Step 3: Seed Initial Data

### Run Seed File

1. **Open SQL Editor** (same as Step 2)
2. **Run Seed File**
   - Open `supabase/seed.sql` from this project
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify Seed Data**
   ```sql
   -- Check subjects (should be 21)
   SELECT COUNT(*) FROM subjects;
   
   -- Check subscription plans (should be 6)
   SELECT COUNT(*) FROM subscription_plans;
   
   -- Check coupon codes (should be 3)
   SELECT COUNT(*) FROM coupon_codes;
   ```

---

## Step 4: Verify Database Setup

### Check All Tables Exist

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Tables (15):**
- ✅ coupon_codes
- ✅ mock_exam_sessions
- ✅ notifications
- ✅ payments
- ✅ questions
- ✅ quiz_attempts
- ✅ study_materials
- ✅ study_targets
- ✅ subject_combinations
- ✅ subjects
- ✅ subscription_plans
- ✅ topics
- ✅ user_profiles
- ✅ user_progress
- ✅ user_subscriptions

### Check RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

---

## Step 5: Import Questions

### Prepare Question Data

Questions are currently in:
- `data/jamb-waec-questions.json` (~30-40 questions)
- `data/extra-quizzes.json` (10 questions)

### Run Import Script

```bash
# From project root
node scripts/import-jamb-waec-questions.js
```

**What this does:**
1. Reads questions from JSON files
2. Creates topics if they don't exist
3. Maps questions to correct subjects and topics
4. Bulk inserts into Supabase

### Verify Questions Imported

```sql
-- Check total questions
SELECT COUNT(*) FROM questions;

-- Check questions by subject
SELECT s.name, COUNT(q.id) as question_count
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id
GROUP BY s.name
ORDER BY question_count DESC;
```

---

## Step 6: Set Up Authentication

### Enable Email Authentication

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### Configure Auth Settings

1. Go to **Authentication > Settings**
2. Set **Site URL**: `http://localhost:5173` (development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/auth/callback`
   - `https://your-production-domain.com/auth/callback`

### Update Frontend Auth

Replace mock auth in `src/hooks/useAuth.tsx` with Supabase Auth:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Use supabase.auth.signUp(), signIn(), signOut()
```

---

## Step 7: Test Database Connection

### Test from Frontend

```bash
# Start development server
npm run dev
```

Visit `http://localhost:5173` and check:
- ✅ Subjects load correctly
- ✅ Questions display in quizzes
- ✅ No console errors

### Test from Server

```bash
# Start Express server
npm run server
```

Test API endpoint:
```bash
curl http://localhost:3001/api/questions?subject=mathematics&count=10
```

---

## Step 8: Clean Up Migration Files

**⚠️ IMPORTANT:** Only do this AFTER verifying database works correctly!

```bash
# Delete migration files
rm -rf supabase/migrations/*.sql

# Keep documentation
# - supabase/migrations/DATABASE_STRUCTURE.md (moved to docs/)
# - supabase/migrations/MIGRATION_NOTES.md
# - supabase/migrations/README.md
```

---

## Troubleshooting

### Issue: "relation does not exist"
**Solution:** Schema not created. Re-run `supabase/schema.sql`

### Issue: "permission denied for table"
**Solution:** RLS policies blocking access. Check policies or use service key

### Issue: Questions not loading
**Solution:** 
1. Check if questions table has data: `SELECT COUNT(*) FROM questions;`
2. Verify topics exist: `SELECT COUNT(*) FROM topics;`
3. Run import script again

### Issue: Authentication not working
**Solution:**
1. Check Supabase Auth is enabled
2. Verify environment variables are correct
3. Check redirect URLs are configured

---

## Next Steps

After database setup:
1. ✅ Test all quiz modes (Practice, Mock Exam, Reader, Past Questions)
2. ✅ Test user registration and login
3. ✅ Test subscription flow
4. ✅ Deploy to production
5. ✅ Update production environment variables

---

## Database Maintenance

### Backup Database

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

### Reset Database (Development Only)

```bash
# ⚠️ WARNING: This deletes ALL data!
supabase db reset
```

Then re-run schema.sql and seed.sql

---

## Support

For issues or questions:
- Check Supabase docs: https://supabase.com/docs
- Review `docs/DATABASE_REFERENCE.md`
- Check project README.md


