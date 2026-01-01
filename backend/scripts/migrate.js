require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function migrate() {
    try {
        const schemaPath = path.join(__dirname, '../../database/schema_sqlite.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running migration...');
        // Split by semicolon to run statements individually (sqlite limitation with some drivers)
        const statements = schemaSql.split(';').filter(stmt => stmt.trim());

        for (const stmt of statements) {
            await db.query(stmt);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
