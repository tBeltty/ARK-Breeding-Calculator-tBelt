/**
 * Guild Repository
 * 
 * Handles all database operations for Discord guilds (servers).
 * Following Repository pattern from Clean Architecture.
 */

import { getDatabase } from '../sqlite.js';

export class GuildRepository {
    /**
     * Find a guild by ID, or create it if it doesn't exist
     */
    static findOrCreate(guildId) {
        const db = getDatabase();

        let guild = db.prepare('SELECT * FROM guilds WHERE id = ?').get(guildId);

        if (!guild) {
            db.prepare(`
                INSERT INTO guilds (id) VALUES (?)
            `).run(guildId);

            guild = db.prepare('SELECT * FROM guilds WHERE id = ?').get(guildId);
        }

        return guild;
    }

    /**
     * Find a guild by ID
     */
    static findById(guildId) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM guilds WHERE id = ?').get(guildId);
    }


    /**
     * Update guild settings
     */
    static updateSettings(guildId, settings) {
        const db = getDatabase();

        const allowedFields = [
            'game_version',
            'server_rates',
            'notify_mode',
            'notify_channel_id',
            'alert_threshold',
            'locale',
            'command_restrictions'
        ];

        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(settings)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) return null;

        values.push(guildId);

        db.prepare(`
            UPDATE guilds 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(...values);

        return this.findOrCreate(guildId);
    }

    /**
     * Get all guilds with active creatures (for notifications)
     */
    static getGuildsWithActiveCreatures() {
        const db = getDatabase();

        return db.prepare(`
            SELECT DISTINCT g.* 
            FROM guilds g
            INNER JOIN creatures c ON c.guild_id = g.id
            WHERE c.status = 'active'
        `).all();
    }

    /**
     * Delete a guild and all related data
     */
    static delete(guildId) {
        const db = getDatabase();
        db.prepare('DELETE FROM guilds WHERE id = ?').run(guildId);
    }
}
