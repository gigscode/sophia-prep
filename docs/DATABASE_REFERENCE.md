# Sophia Prep Database Reference
**Moved from:** `supabase/migrations/DATABASE_STRUCTURE.md`  
**Date:** 2025-01-21

---

## Complete Table List (15 Tables)

### Core Content Tables (3 tables)
1. **subjects** - JAMB/WAEC exam subjects (21 subjects)
2. **topics** - Topics within subjects
3. **questions** - Quiz questions with options and explanations

### User & Progress Tables (5 tables)
4. **user_profiles** - Extended user information (exam type, target date, preferences)
5. **quiz_attempts** - Quiz completion data (scores, time, answers)
6. **user_progress** - Learning material completion tracking
7. **subject_combinations** - User's selected subject combinations
8. **study_targets** - Daily/weekly/monthly study goals

### Content & Resources Tables (3 tables)
9. **study_materials** - Learning resources (syllabus, novels, videos)
10. **notifications** - User notifications
11. **mock_exam_sessions** - Mock exam tracking

### Subscription & Payment Tables (4 tables)
12. **subscription_plans** - Available subscription plans (JAMB, WAEC, bundles)
13. **user_subscriptions** - User subscription records
14. **payments** - Payment transaction records (Paystack integration)
15. **coupon_codes** - Discount coupon management

---

## Table Relationships

```
auth.users (Supabase Auth)
    ├── user_profiles (1:1)
    ├── subject_combinations (1:many)
    ├── quiz_attempts (1:many)
    ├── user_progress (1:many)
    ├── user_subscriptions (1:many)
    ├── payments (1:many)
    ├── notifications (1:many)
    ├── study_targets (1:many)
    └── mock_exam_sessions (1:many)

subjects
    ├── topics (1:many)
    ├── study_materials (1:many)
    └── subscription_plans.included_subjects (many:many via array)

topics
    └── questions (1:many)

subscription_plans
    └── user_subscriptions (1:many)

user_subscriptions
    └── payments (1:many)

study_materials
    └── user_progress (1:many)
```

---

## Critical Tables Explained

### 1. quiz_attempts
**Purpose:** Track all quiz completions for analytics and progress tracking

**Why Critical:**
- Analytics dashboard requires this data
- Leaderboard functionality depends on it
- User performance tracking
- Progress over time visualization

**Without it:** Users can't see their quiz history or track improvement

### 2. user_progress
**Purpose:** Track learning material completion

**Why Critical:**
- Shows which study materials user has completed
- Tracks progress percentage for each material
- Enables "Continue where you left off" feature

**Without it:** Users can't track what they've studied

### 3. subscription_plans
**Purpose:** Define available subscription tiers

**Why Critical:**
- Defines JAMB Only, WAEC Only, Science/Commercial/Arts bundles
- Sets pricing and duration
- Controls feature access

**Without it:** Can't offer premium subscriptions

### 4. user_subscriptions
**Purpose:** Track active user subscriptions

**Why Critical:**
- Controls access to premium content
- Manages subscription lifecycle (active, expired, cancelled)
- Links to payment records

**Without it:** Can't manage premium access

### 5. payments
**Purpose:** Record all payment transactions

**Why Critical:**
- Audit trail for financial transactions
- Paystack integration tracking
- Payment history for users
- Reconciliation and reporting

**Without it:** Can't process or track payments

---

## Database Setup Instructions

See `docs/DATABASE_SETUP.md` for step-by-step setup instructions.

---

## Schema Version
**Version:** 1.0.0  
**Last Updated:** 2025-01-21  
**Migration Strategy:** Fresh schema creation (no migrations)


