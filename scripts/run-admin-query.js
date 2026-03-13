import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Missing DATABASE_URL environment variable');
        console.log('\nPlease run the script like this:');
        console.log('DATABASE_URL="postgres://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres" node scripts/run-admin-query.js\n');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        // Provide some standard SSL options for Supabase pooler connection
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();

        const sqlPath = path.join(__dirname, '..', 'supabase', 'make_admin_lifetime_user.sql');
        console.log(`Reading SQL file from: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        const result = await client.query(sql);

        // The script has a SELECT at the end to verify
        if (result && Array.isArray(result) && result.length > 0) {
            const selectResult = result[result.length - 1];
            if (selectResult.rows) {
                console.log('\n✅ Verification Query Result:');
                console.table(selectResult.rows);
            }
        }

        console.log('\n✅ Script executed successfully!');
    } catch (error) {
        console.error('\n❌ Error executing script:');
        console.error(error.message || error);
    } finally {
        await client.end();
    }
}

run();
