const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const util = require('util');

// Create a database file in the backend directory
const dbPath = path.resolve(__dirname, '../../chatbot.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Promisify the standard sqlite3 methods for easier async/await usage
db.query = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        // Determine if it's a SELECT (use all) or INSERT/UPDATE/DELETE (use run)
        const isSelect = sql.trim().toLowerCase().startsWith('select');
        // Handle RETURNING clause simulation for INSERTs if strictly needed, 
        // but standard sqlite3 doesn't return rows on run().
        // We will handle data retrieval manually in the controllers for SQLite compat.

        if (isSelect || sql.toLowerCase().includes('returning')) {
            // Note: node-sqlite3 doesn't support RETURNING natively well in .run, uses .all or .get
            // If query has returning, we use .all
            db.all(sql, params, function (err, rows) {
                if (err) return reject(err);
                resolve({ rows: rows, rowCount: rows.length });
            });
        } else {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
            });
        }
    });
};

module.exports = db;
