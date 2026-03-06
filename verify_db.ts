import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '/Users/user1/Desktop/sophia-prep/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log("Verifying Database Schema...\n");

    // 1. Check if subjects_with_details view exists
    const { data: viewData, error: viewError } = await supabase
        .from('subjects_with_details')
        .select('*')
        .limit(1);

    if (viewError) {
        if (viewError.code === 'PGRST205') {
            console.log("❌ View 'subjects_with_details' NOT FOUND. (Did you run fix_missing_schema.sql?)");
        } else {
            console.error("❌ Error checking 'subjects_with_details':", viewError.message);
        }
    } else {
        console.log("✅ View 'subjects_with_details' exists.");
    }

    // 2. Check questions table for new columns (subject_id and exam_type)
    const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('id, subject_id, topic_id, exam_type')
        .limit(1);

    if (qError) {
        if (qError.code === 'PGRST204') {
            console.log("❌ Columns missing in 'questions' table. (Did you run fix_questions_upload.sql?)");
            console.log("Details:", qError.message);
        } else {
            console.error("❌ Error checking 'questions' table:", qError.message);
        }
    } else {
        console.log("✅ Table 'questions' has the correct columns (subject_id, topic_id, exam_type).");
    }
}

verifySchema().catch(console.error);
