Below is the consolidated list of every table in your public schema with row counts and column details (name → data type, notable constraints/defaults). I’ve included primary keys and any foreign key references found.

subjects — rows: 19

id (uuid, default gen_random_uuid()) — PK
name (text)
slug (text, unique)
description (text, nullable)
icon (text, nullable)
color_theme (text, nullable)
exam_type (text, default 'BOTH', check JAMB/WAEC/BOTH)
subject_category (text, default 'GENERAL', check values)
is_mandatory (boolean, default false)
is_active (boolean, default true)
sort_order (integer, default 0)
created_at (timestamptz, default now())
updated_at (timestamptz, default now())
Foreign keys referencing: public.study_materials.subject_id, public.quiz_attempts.subject_id, public.questions.subject_id, public.exam_items.subject_id
questions — rows: 209

id (uuid, default gen_random_uuid()) — PK
question_text (text)
option_a/b/c/d (text)
correct_answer (text, check A/B/C/D)
explanation (text, nullable)
exam_year (integer, nullable)
exam_type (text, nullable, check JAMB/WAEC)
question_number (integer, nullable)
is_active (boolean, default true)
created_at, updated_at (timestamptz, default now())
metadata (jsonb, default '{}')
subject_id (uuid, nullable) — FK → public.subjects.id
subject_combinations — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
exam_type (text, check JAMB/WAEC)
combination_type (text, nullable, check SCIENCE/COMMERCIAL/ARTS/CUSTOM)
subjects (text[])
created_at, updated_at (timestamptz, default now())
study_materials — rows: 0

id (uuid, default gen_random_uuid()) — PK
type (text, check SYLLABUS/NOVEL/TOPIC_SUMMARY/VIDEO/BROCHURE)
subject_id (uuid, nullable) — FK → public.subjects.id
title (text)
content (text)
summary (text, nullable)
exam_type (text, default 'BOTH', check)
is_premium (boolean, default false)
order_index (integer, default 0)
metadata (jsonb, default '{}')
created_by (uuid, nullable) — FK → auth.users.id
created_at, updated_at (timestamptz, default now())
notifications — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
type (text, check types: SCORE/TARGET_REMINDER/ACHIEVEMENT/SUBSCRIPTION/SYSTEM)
title (text)
message (text)
data (jsonb, default '{}', nullable)
is_read (boolean, default false)
created_at (timestamptz, default now())
expires_at (timestamptz, nullable)
study_targets — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
target_type (text, check DAILY/WEEKLY/MONTHLY)
target_value (integer, check > 0)
current_progress (integer, default 0)
reminder_time (time, nullable)
is_active (boolean, default true)
created_at, updated_at (timestamptz, default now())
mock_exam_sessions — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
exam_type (text, check JAMB/WAEC)
subjects (jsonb)
total_time_limit (integer)
started_at (timestamptz, default now())
completed_at (timestamptz, nullable)
total_score, total_questions (integer, nullable)
created_at (timestamptz, default now())
quiz_attempts — rows: 2

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
subject_id (uuid, nullable) — FK → public.subjects.id
topic_id (uuid, nullable)
quiz_mode (text, check PRACTICE/MOCK_EXAM/READER/PAST_QUESTIONS)
total_questions (integer, check >0)
correct_answers, incorrect_answers (integer, checks)
score_percentage (numeric, 0–100)
time_taken_seconds (integer, check >=0)
exam_year (integer, nullable)
questions_data (jsonb, default '[]')
completed_at, created_at (timestamptz, default now())
exam_type (text, nullable, check JAMB/WAEC)
user_progress — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
material_id (uuid) — FK → public.study_materials.id
progress_percentage (integer, default 0, check 0–100)
is_completed (boolean, default false)
last_accessed_at (timestamptz, default now())
completed_at, created_at, updated_at (timestamptz)
subscription_plans — rows: 6

id (uuid, default gen_random_uuid()) — PK
plan_id (text, unique)
name (text)
description (text, nullable)
exam_type (text, nullable, check JAMB/WAEC/BOTH)
bundle_type (text, check allowed values)
included_subjects (text[], nullable)
amount (numeric, check >= 0)
currency (text, default 'NGN')
interval (text, check WEEKLY/MONTHLY/QUARTERLY/YEARLY)
features (text[], default '{}')
is_active (boolean, default true)
sort_order (integer, default 0)
created_at, updated_at (timestamptz, default now())
slug (text, nullable, unique)
FK referenced by: public.user_subscriptions.plan_id
user_subscriptions — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
plan_id (uuid) — FK → public.subscription_plans.id
status (text, default 'PENDING', check ACTIVE/EXPIRED/CANCELLED/PENDING)
start_date (timestamptz, default now())
end_date (timestamptz, nullable)
auto_renew (boolean, default false)
payment_reference (text, nullable)
amount_paid (numeric)
currency (text, default 'NGN')
created_at, updated_at (timestamptz)
payments — rows: 0

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
subscription_id (uuid, nullable) — FK → public.user_subscriptions.id
payment_reference (text, unique)
amount (numeric, check >= 0)
currency (text, default 'NGN')
status (text, default 'PENDING', check PENDING/SUCCESS/FAILED/CANCELLED)
payment_method, payment_gateway (text, gateway default 'PAYSTACK')
gateway_response (jsonb, default '{}')
paid_at (timestamptz, nullable)
created_at, updated_at (timestamptz)
coupon_codes — rows: 3

id (uuid, default gen_random_uuid()) — PK
code (text, unique)
description (text, nullable)
discount_type (text, check PERCENTAGE/FIXED_AMOUNT)
discount_value (numeric, check > 0)
max_uses (integer, nullable)
current_uses (integer, default 0)
valid_from (timestamptz, default now())
valid_until (timestamptz, nullable)
applicable_plans (text[], nullable)
is_active (boolean, default true)
created_by (uuid, nullable) — FK → auth.users.id
created_at, updated_at (timestamptz)
user_profiles — rows: 14

id (uuid) — PK (references auth.users.id)
full_name (text, nullable)
phone_number (text, nullable)
exam_type (text, nullable, check JAMB/WAEC/BOTH)
target_exam_date (date, nullable)
preferred_subjects (text[], nullable)
avatar_url (text, nullable)
bio (text, nullable)
created_at, updated_at (timestamptz, default now())
email (text, nullable)
is_active (boolean, default true)
last_login (timestamptz, nullable)
subscription_plan (text, default 'Free')
exam_items — rows: 0

id (uuid, default gen_random_uuid()) — PK
subject_id (uuid, nullable) — FK → public.subjects.id
topic_id (uuid, nullable)
item_type (text, check ESSAY/PRACTICAL)
prompt (text)
expected_structure (text, nullable)
mark_weighting (integer, default 0)
time_minutes (integer, default 0)
bloom_level (text, nullable)
related_past (jsonb, default '[]')
exam_types (text[] default ['JAMB','WAEC'])
references (jsonb, default '[]')
is_active (boolean, default true)
created_at, updated_at (timestamptz)
timer_configurations — rows: 2

id (uuid, default gen_random_uuid()) — PK
exam_type (text, check JAMB/WAEC)
subject_slug (text, nullable)
year (integer, nullable)
duration_seconds (integer, check > 0)
created_at, updated_at (timestamptz)
exam_types — rows: 2 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
name (text, unique)
slug (text, unique)
description (text, nullable)
full_name (text, nullable)
duration_minutes (integer, nullable)
total_questions (integer, nullable)
passing_score (integer, nullable)
is_active (boolean, default true)
sort_order (integer, default 0)
created_at, updated_at (timestamptz)
Referenced by several legacy/new tables (questions_new, subject_exam_types, etc.)
subject_categories — rows: 5 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
name (text, unique)
slug (text, unique)
description (text, nullable)
color_theme, icon (text, nullable)
is_active (boolean, default true)
sort_order (integer, default 0)
created_at, updated_at (timestamptz)
Referenced by subjects_new, jamb_subject_combinations
subjects_new — rows: 24 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
name, slug (text, slug unique)
description, icon, color_theme (text, nullable)
category_id (uuid, nullable) — FK → public.subject_categories.id
is_mandatory (boolean, default false)
is_active (boolean, default true)
sort_order (integer, default 0)
created_at, updated_at (timestamptz)
subject_exam_types — rows: 43 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
subject_id (uuid) — FK → public.subjects_new.id
exam_type_id (uuid) — FK → public.exam_types.id
is_mandatory (boolean, default false)
max_questions (integer, nullable)
created_at (timestamptz)
questions_new — rows: 438 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
subject_id (uuid) — FK → public.subjects_new.id
exam_type_id (uuid, nullable) — FK → public.exam_types.id
question_text, option_a/b/c/d (text)
correct_answer (text, check A/B/C/D)
explanation (text, nullable)
difficulty_level (text, default 'MEDIUM', check EASY/MEDIUM/HARD)
exam_year, question_number (integer, nullable)
metadata (jsonb, default '{}')
is_active (boolean, default true)
created_at, updated_at (timestamptz)
quiz_mode_configs — rows: 2 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
mode_name (text, unique)
display_name (text)
description (text, nullable)
has_timer (boolean, default false)
show_explanations_during (boolean, default false)
show_explanations_after (boolean, default true)
allow_manual_submit (boolean, default true)
auto_submit_on_timeout (boolean, default false)
default_time_limit_minutes (integer, nullable)
created_at (timestamptz)
quiz_attempts_new — rows: 0 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
user_id (uuid) — FK → auth.users.id
subject_id (uuid, nullable) — FK → public.subjects_new.id
exam_type_id (uuid, nullable) — FK → public.exam_types.id
quiz_mode (text, check PRACTICE/CBT_EXAM)
total_questions (integer, check 1–180)
questions_requested (integer, nullable)
correct_answers, incorrect_answers (integer, checks)
score_percentage (numeric, 0–100)
time_taken_seconds (integer, check >=0)
time_limit_seconds (integer, nullable)
is_auto_submitted (boolean, default false)
exam_year (integer, nullable)
questions_data (jsonb, default '[]')
completed_at, created_at (timestamptz, default now())
cbt_exam_configs — rows: 2 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
exam_type_id (uuid, unique) — FK → public.exam_types.id
min_questions (integer, default 5, check >=5)
max_questions (integer, default 180, check <=180)
time_per_question_minutes (numeric, default 1.0)
allow_custom_question_count (boolean, default true)
created_at, updated_at (timestamptz)
jamb_subject_combinations — rows: 0 (RLS disabled)

id (uuid, default gen_random_uuid()) — PK
combination_name (text)
category_id (uuid, nullable) — FK → public.subject_categories.id
mandatory_subjects (uuid[])
elective_subjects (uuid[])
min_electives (integer, default 2)
max_electives (integer, default 3)
description (text, nullable)
is_active (boolean, default true)
created_at, updated_at (timestamptz)
Validation: I queried your public schema