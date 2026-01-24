/**
 * SQLite Database Connection
 * 
 * Uses better-sqlite3 for synchronous, fast SQLite operations.
 * Database file is created automatically if it doesn't exist.
 */

import Database from 'better-sqlite3';
import { logger } from '../../shared/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

/**
 * Initialize the database connection and run migrations
 */
export async function initializeDatabase() {
    const dbPath = process.env.DATABASE_PATH || './data/bot.sqlite';

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    const fs = await import('fs');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL'); // Better performance

    // Run migrations
    runMigrations();

    logger.success(`Database connected: ${dbPath}`);
    return db;
}

/**
 * Get the database instance
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Run database migrations
 */
function runMigrations() {
    // Create guilds table
    db.exec(`
        CREATE TABLE IF NOT EXISTS guilds (
            id TEXT PRIMARY KEY,
            game_version TEXT DEFAULT 'ASA',
            server_rates REAL DEFAULT 1.0,
            notify_mode TEXT DEFAULT 'channel',
            notify_channel_id TEXT,
            alert_threshold INTEGER DEFAULT 5,
            locale TEXT DEFAULT 'en',
            premium_tier TEXT DEFAULT 'free',
            command_restrictions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ensure weight column exists (Migration for existing databases)
    try {
        db.exec('ALTER TABLE creatures ADD COLUMN weight REAL');
    } catch (e) {
        // Column likely already exists
    }

    // Ensure command_restrictions column exists (Migration for existing databases)
    try {
        db.exec('ALTER TABLE guilds ADD COLUMN command_restrictions TEXT');
    } catch (e) {
        // Column likely already exists
    }

    // Create creatures table
    db.exec(`
        CREATE TABLE IF NOT EXISTS creatures (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            creature_type TEXT NOT NULL,
            nickname TEXT,
            start_time DATETIME NOT NULL,
            mature_time DATETIME NOT NULL,
            last_notified_at DATETIME,
            status TEXT DEFAULT 'active',
            weight REAL,
            notify_mode TEXT,
            notify_channel_id TEXT,
            FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE
        )
    `);

    // Migrations for existing databases
    try { db.exec('ALTER TABLE creatures ADD COLUMN weight REAL'); } catch (e) { }
    try { db.exec('ALTER TABLE creatures ADD COLUMN notify_mode TEXT'); } catch (e) { }
    try { db.exec('ALTER TABLE creatures ADD COLUMN notify_channel_id TEXT'); } catch (e) { }
    try { db.exec('ALTER TABLE guilds ADD COLUMN command_restrictions TEXT'); } catch (e) { }

    // Create rate_limits table (for anti-abuse)
    db.exec(`
        CREATE TABLE IF NOT EXISTS rate_limits (
            key TEXT PRIMARY KEY,
            count INTEGER DEFAULT 0,
            window_start DATETIME
        )
    `);

    // Create indexes for performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_creatures_guild ON creatures(guild_id);
        CREATE INDEX IF NOT EXISTS idx_creatures_status ON creatures(status);
        CREATE INDEX IF NOT EXISTS idx_creatures_mature ON creatures(mature_time);
    `);

    logger.success('Database migrations complete');
}
