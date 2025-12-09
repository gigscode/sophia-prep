topics — rows: 31
Columns (type): id (uuid), title (text), description (text), icon (text), is_active (boolean), difficulty (text), created_by (uuid), created_at (timestamptz), updated_at (timestamptz), is_premium (boolean), domain_id (uuid)

questions — rows: 2,541
Columns (type): id (uuid), topic_id (uuid), question_text (text), options (jsonb), correct_answer (text), explanation (text), difficulty (text), created_by (uuid), created_at (timestamptz), updated_at (timestamptz), is_premium (boolean), is_active (boolean)

quiz_attempts — rows: 57
Columns (type): id (uuid), user_id (uuid), topic_id (uuid), score (integer), total_questions (integer), answers (jsonb), time_taken (integer), created_at (timestamptz), updated_at (timestamptz)

payments — rows: 0
Columns (type): id (uuid), user_id (uuid), amount (numeric), currency (text), status (text), provider (text), provider_payment_id (text), metadata (jsonb), created_at (timestamptz), updated_at (timestamptz)

settings — rows: 5
Columns (type): id (uuid), setting_key (text), setting_value (text), description (text), is_public (boolean), created_at (timestamptz), updated_at (timestamptz)

admin_users — rows: 2
Columns (type): user_id (uuid), created_at (timestamptz), is_admin (boolean)

subscriptions — rows: 1
Columns (type): id (uuid), user_id (uuid), plan_id (text), amount_paid (numeric), start_date (timestamptz), end_date (timestamptz), is_active (boolean), last_payment_reference (text), subscription_code (text), created_at (timestamptz), updated_at (timestamptz)

learning_materials — rows: 17
Columns (type): id (uuid), topic_id (uuid), title (text), content (text), summary (text), is_premium (boolean), order_index (integer), created_at (timestamptz), created_by (uuid), updated_at (timestamptz)

user_quiz_results — rows: 0
Columns (type): id (uuid), user_id (uuid), topic_id (uuid), score (integer), total_questions (integer), percentage (numeric, generated), time_taken (integer), answers (jsonb), created_at (timestamptz)

feedback — rows: 0
Columns (type): id (uuid), name (text), email (text), subject (text), message (text), user_id (uuid), status (text), created_at (timestamptz), updated_at (timestamptz)

user_profiles — rows: 35
Columns (type): id (uuid), user_id (uuid), email (text), full_name (text), is_subscribed (boolean), is_admin (boolean), subscription_expires_at (timestamptz), subscription_status (text), subscription_plan (text), created_at (timestamptz), updated_at (timestamptz), last_login_at (timestamptz)

domains — rows: 15
Columns (type): id (uuid), name (text), slug (text), description (text), icon (text), color_theme (text), difficulty_level (text), estimated_duration_weeks (integer), prerequisites (text[]), is_active (boolean), sort_order (integer), created_at (timestamptz), updated_at (timestamptz)

domain_subscription_plans — rows: 12
Columns (type): id (uuid), domain_id (uuid), plan_id (text), name (text), amount (integer), interval (text), features (text[]), is_active (boolean), created_at (timestamptz), updated_at (timestamptz)

domain_learning_paths — rows: 23
Columns (type): id (uuid), domain_id (uuid), name (text), description (text), difficulty_level (text), estimated_hours (integer), sort_order (integer), is_active (boolean), created_at (timestamptz), updated_at (timestamptz)

path_topics — rows: 26
Columns (type): id (uuid), learning_path_id (uuid), topic_id (uuid), sort_order (integer), is_required (boolean), created_at (timestamptz)

user_domain_progress — rows: 0
Columns (type): id (uuid), user_id (uuid), domain_id (uuid), learning_path_id (uuid), completed_topics (integer), total_topics (integer), completion_percentage (numeric), started_at (timestamptz), last_activity_at (timestamptz), completed_at (timestamptz), created_at (timestamptz), updated_at (timestamptz)

user_entitlements — rows: 0
Columns (type): id (uuid), user_id (uuid), entitlement_type (text), ref_id (uuid), started_at (timestamptz), expires_at (timestamptz), status (text), source_payment_id (uuid), provider_ref (text), meta (jsonb), created_at (timestamptz)

quiz_sessions — rows: 0
Columns (type): id (uuid), user_id (uuid), topic_id (uuid), questions_data (jsonb), quiz_length (integer), created_at (timestamptz), expires_at (timestamptz), completed_at (timestamptz), score (integer), total_questions (integer), time_taken (integer)

question_analytics — rows: 472
Columns (type): id (uuid), question_id (uuid), user_id (uuid), quiz_session_id (uuid), answered_correctly (boolean), time_to_answer (integer), selected_option (integer), created_at (timestamptz)

topic_domains — rows: 27
Columns (type): id (uuid), topic_id (uuid), domain_id (uuid), created_at (timestamptz), created_by (uuid)

coupons — rows: 1
Columns (type): id (uuid), code (text), name (text), description (text), discount_type (text), discount_value (numeric), max_uses (integer), max_uses_per_user (integer), minimum_purchase_amount (numeric), applicable_domains (text[]), applicable_plans (text[]), valid_from (timestamptz), valid_until (timestamptz), is_active (boolean), created_by (uuid), created_at (timestamptz), updated_at (timestamptz)

coupon_usage — rows: 0
Columns (type): id (uuid), coupon_id (uuid), user_id (uuid), original_amount (numeric), discount_amount (numeric), final_amount (numeric), plan_id (text), domain_id (uuid), payment_reference (text), used_at (timestamptz)

quiz_analytics — rows: 0
Columns (type): id (uuid), mode (text), topic_id (uuid), user_id (uuid), questions_requested (integer), questions_completed (integer), completion_rate (numeric), time_spent (integer), score (integer), device_type (text), timestamp (timestamptz), created_at (timestamptz)

If you want:

SQL to export all table rows (SELECT * for each table) — I can generate and run those queries (confirm before I execute).
CSV/JSON exports per table.
Column-only output in machine-readable JSON.*
Please tell me which of the above you'd like next.

