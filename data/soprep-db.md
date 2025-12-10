Database tables, columns, extensions, and Edge Functions
Below is a concise summary of the public schema tables and their columns, followed by installed extensions and Edge Functions.

Validation: I listed tables in public, retrieved installed extensions, and listed Edge Functions (none found).

Tables in public (with row counts)
subjects (24 rows)

Columns: id (uuid, pk, default gen_random_uuid()), name (text), slug (text, unique), description (text), icon (text), color_theme (text), exam_type (text, default 'BOTH', check), subject_category (text, default 'GENERAL', check), is_mandatory (boolean, default false), is_active (boolean, default true), sort_order (integer, default 0), created_at (timestamptz, default now()), updated_at (timestamptz, default now())
FKs: referenced by study_materials.subject_id, quiz_attempts.subject_id, exam_items.subject_id
questions (215 rows)

Columns: id (uuid, pk, default gen_random_uuid()), question_text (text), option_a/b/c/d (text), correct_answer (text, check A/B/C/D), explanation (text), difficulty_level (text, default 'MEDIUM', check), exam_year (int), exam_type (text, check), question_number (int), is_active (bool, default true), created_at, updated_at, metadata (jsonb, default '{}')
subject_combinations (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), exam_type (text, check), combination_type (text, check), subjects (text[]), created_at, updated_at
study_materials (0 rows)

Columns: id (uuid, pk), type (text, check), subject_id (uuid, fk -> public.subjects.id), title (text), content (text), summary (text), exam_type (text, default 'BOTH', check), is_premium (bool, default false), order_index (int, default 0), metadata (jsonb, default '{}'), created_by (uuid, fk -> auth.users.id), created_at, updated_at
notifications (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), type (text, check), title (text), message (text), data (jsonb, default '{}'), is_read (bool, default false), created_at, expires_at
study_targets (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), target_type (text, check), target_value (int, check >0), current_progress (int, default 0), reminder_time (time), is_active (bool, default true), created_at, updated_at
mock_exam_sessions (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), exam_type (text, check), subjects (jsonb), total_time_limit (int), started_at (timestamptz, default now()), completed_at, total_score (int), total_questions (int), created_at
quiz_attempts (2 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), subject_id (uuid, fk -> public.subjects.id), topic_id (uuid), quiz_mode (text, check), total_questions (int), correct_answers (int), incorrect_answers (int), score_percentage (numeric, check 0-100), time_taken_seconds (int), exam_year (int), questions_data (jsonb, default '[]'), completed_at (timestamptz, default now()), created_at, exam_type (text, check)
user_progress (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), material_id (uuid, fk -> public.study_materials.id), progress_percentage (int, default 0, check 0-100), is_completed (bool, default false), last_accessed_at (timestamptz, default now()), completed_at, created_at, updated_at
subscription_plans (6 rows)

Columns: id (uuid, pk), plan_id (text, unique), name (text), description (text), exam_type (text, check), bundle_type (text, check), included_subjects (text[]), amount (numeric, check >=0), currency (text, default 'NGN'), interval (text, check), features (text[]), is_active (bool, default true), sort_order (int, default 0), created_at, updated_at, slug (text, unique)
FK: referenced by user_subscriptions.plan_id
user_subscriptions (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), plan_id (uuid, fk -> public.subscription_plans.id), status (text, default 'PENDING', check), start_date (timestamptz, default now()), end_date (timestamptz), auto_renew (bool, default false), payment_reference (text), amount_paid (numeric), currency (text, default 'NGN'), created_at, updated_at
FKs: payments.subscription_id, user_subscriptions_plan_id_fkey
payments (0 rows)

Columns: id (uuid, pk), user_id (uuid, fk -> auth.users.id), subscription_id (uuid, fk -> public.user_subscriptions.id), payment_reference (text, unique), amount (numeric, check >=0), currency (text, default 'NGN'), status (text, default 'PENDING', check), payment_method (text), payment_gateway (text, default 'PAYSTACK'), gateway_response (jsonb, default '{}'), paid_at, created_at, updated_at
coupon_codes (3 rows)

Columns: id (uuid, pk), code (text, unique), description (text), discount_type (text, check), discount_value (numeric, check >0), max_uses (int), current_uses (int, default 0), valid_from (timestamptz, default now()), valid_until (timestamptz), applicable_plans (text[]), is_active (bool, default true), created_by (uuid, fk -> auth.users.id), created_at, updated_at
user_profiles (14 rows)

Columns: id (uuid, pk -> auth.users.id), full_name (text), phone_number (text), exam_type (text, check), target_exam_date (date), preferred_subjects (text[]), avatar_url (text), bio (text), created_at, updated_at, email (text), is_active (bool, default true), last_login (timestamptz), subscription_plan (text, default 'Free')
exam_items (0 rows)

Columns: id (uuid, pk), subject_id (uuid, fk -> public.subjects.id), topic_id (uuid), item_type (text, check), prompt (text), expected_structure (text), mark_weighting (int, default 0), time_minutes (int, default 0), bloom_level (text), related_past (jsonb, default '[]'), exam_types (text[] default ['JAMB','WAEC']), references (jsonb, default '[]'), is_active (bool, default true), created_at, updated_at
timer_configurations (4 rows)

Columns: id (uuid, pk), exam_type (text, check), subject_slug (text), year (int), duration_seconds (int, check >0), created_at, updated_at
Installed extensions (high level)
Notable: postgis, postgis_topology, vector, pg_stat_statements, plpgsql, pgcrypto, uuid-ossp, pg_trgm, pg_repack, pg_cron, pg_sodium, pgjwt, and many others.
Edge Functions
None found.