/**
 * Settings Repository
 * 
 * Handles global bot settings stored in the global_settings table.
 */

import { getDatabase } from '../sqlite.js';

export class SettingsRepository {
    /**
     * Get a setting by key
     * @param {string} key 
     * @returns {string|null}
     */
    static get(key) {
        try {
            const db = getDatabase();
            const row = db.prepare('SELECT value FROM global_settings WHERE key = ?').get(key);
            return row ? row.value : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Set a setting
     * @param {string} key 
     * @param {string} value 
     */
    static set(key, value) {
        const db = getDatabase();
        db.prepare(`
            INSERT INTO global_settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
        `).run(key, value);
    }

    /**
     * List all global settings
     */
    static listAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM global_settings').all();
    }
}
