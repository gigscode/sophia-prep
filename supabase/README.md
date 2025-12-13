# Sophia Prep - Supabase Database

This directory contains the database schema and seed data for the Sophia Prep platform.

---

## 📁 Directory Structure

```
supabase/
├── schema.sql          # Complete database schema (15 tables + RLS policies)
├── seed.sql            # Initial seed data (subjects, plans, coupons)
├── README.md           # This file
└── migrations/         # Legacy migration files (REMOVED - using fresh schema)
    ├── DATABASE_STRUCTURE.md    # Moved to docs/DATABASE_REFERENCE.md
    ├── MIGRATION_NOTES.md       # Historical reference
    └── README.md                # Migration documentation
```

---

## 🚀 Quick Start

### 1. Create Database Schema

```sql
-- Open Supabase Dashboard > SQL Editor
-- Copy and paste contents of schema.sql
-- Execute
```

### 2. Seed Initial Data

```sql
-- Open Supabase Dashboard > SQL Editor
-- Copy and paste contents of seed.sql
-- Execute
```

### 3. Import Questions

```bash
# From project root
node scripts/import-jamb-questions.js
```

---

## 📊 Database Overview

### Tables (15 total)

**Core Content (3 tables)**
- `subjects` - JAMB subjects
- `topics` - Topics within subjects
- `questions` - Quiz questions with options

**User & Progress (5 tables)**
- `user_profiles` - Extended user info
- `quiz_attempts` - Quiz history & scores
- `user_progress` - Learning material progress
- `subject_combinations` - User's subject selections
- `study_targets` - Daily/weekly/monthly goals

**Content & Resources (3 tables)**
- `study_materials` - Videos, PDFs, syllabus
- `notifications` - User notifications
- `mock_exam_sessions` - Mock exam tracking

**Subscription & Payment (4 tables)**
- `subscription_plans` - 6 subscription tiers
- `user_subscriptions` - Active subscriptions
- `payments` - Payment transactions
- `coupon_codes` - Discount coupons

---

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**Public Read:**
- ✅ Subjects, Topics, Questions (active only)
- ✅ Free study materials
- ✅ Subscription plans

**Authenticated Read:**
- ✅ Premium study materials
- ✅ Coupon codes

**User-Specific (Own Data Only):**
- ✅ User profiles
- ✅ Quiz attempts
- ✅ Progress tracking
- ✅ Subscriptions
- ✅ Payments

---

## 📈 Helper Functions

### `has_active_subscription(user_uuid)`
Check if user has active subscription

```sql
SELECT has_active_subscription(auth.uid());
```

### `get_user_accessible_subjects(user_uuid)`
Get subjects user can access based on subscription

```sql
SELECT get_user_accessible_subjects(auth.uid());
```

### `validate_coupon_code(code)`
Validate coupon code and get discount details

```sql
SELECT * FROM validate_coupon_code('WELCOME2025');
```

---

## 📊 Analytics Views

### `user_performance_summary`
Overall user performance metrics

```sql
SELECT * FROM user_performance_summary WHERE user_id = auth.uid();
```

### `subject_performance`
Performance breakdown by subject

```sql
SELECT * FROM subject_performance WHERE user_id = auth.uid();
```

### `active_subscriptions`
All active subscriptions with plan details

```sql
SELECT * FROM active_subscriptions WHERE user_id = auth.uid();
```

---

## 🔄 Migration Strategy

**Previous:** Used numbered migration files (`.sql`)  
**Current:** Fresh schema creation (no migrations)

**Why the change?**
- ✅ Simpler to maintain
- ✅ Easier to understand
- ✅ No migration history complexity
- ✅ Clean slate for production

**Migration files removed:**
- All `20250101000000_*.sql` files deleted
- Documentation preserved in `docs/` folder

---

## 📚 Documentation

For detailed setup instructions, see:
- **Setup Guide:** `docs/DATABASE_SETUP.md`
- **Schema Reference:** `docs/DATABASE_REFERENCE.md`
- **Audit Report:** `AUDIT_REPORT.md`

---

## ✅ Verification Checklist

After running schema and seed:

```sql
-- Check table count (should be 15)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check subjects (should be 21)
SELECT COUNT(*) FROM subjects;

-- Check subscription plans (should be 6)
SELECT COUNT(*) FROM subscription_plans;

-- Check RLS enabled (all should be true)
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' ORDER BY tablename;
```

---

## 🛠️ Maintenance

### Backup Database

```bash
supabase db dump -f backup.sql
```

### Reset Database (Dev Only)

```bash
# ⚠️ WARNING: Deletes all data!
supabase db reset
```

### Update Schema

1. Edit `schema.sql`
2. Test in development
3. Apply to production via SQL Editor

---

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Project Issues: GitHub Issues
- Database Questions: See `docs/DATABASE_REFERENCE.md`


