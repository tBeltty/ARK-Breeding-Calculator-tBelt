/**
 * Creature Repository
 * 
 * Handles all database operations for tracked creatures.
 * Following Repository pattern from Clean Architecture.
 */

import { getDatabase } from '../sqlite.js';

// Maximum creatures per guild (free tier limit)
const MAX_CREATURES_FREE = 2;
const MAX_CREATURES_PRO = 50;
const MAX_CREATURES_TRIBE = 1000; // Effectively unlimited

export class CreatureRepository {
    /**
     * Create a new tracked creature
     */
    static create(data) {
        const db = getDatabase();

        const result = db.prepare(`
            INSERT INTO creatures (guild_id, user_id, creature_type, nickname, start_time, mature_time, weight, notify_mode, notify_channel_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.guildId,
            data.userId,
            data.creatureType,
            data.nickname || null,
            data.startTime,
            data.matureTime,
            data.weight || null,
            data.notifyMode || null,
            data.notifyChannelId || null
        );

        return this.findById(result.lastInsertRowid);
    }

    /**
     * Find a creature by ID
     */
    static findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM creatures WHERE id = ?').get(id);
    }

    /**
     * Get all active creatures for a guild
     */
    static findActiveByGuild(guildId) {
        const db = getDatabase();
        return db.prepare(`
            SELECT * FROM creatures 
            WHERE guild_id = ? AND status = 'active'
            ORDER BY mature_time ASC
        `).all(guildId);
    }

    /**
     * Get all active creatures for a user in a guild
     */
    static findActiveByUser(guildId, userId) {
        const db = getDatabase();
        return db.prepare(`
            SELECT * FROM creatures 
            WHERE guild_id = ? AND user_id = ? AND status = 'active'
            ORDER BY mature_time ASC
        `).all(guildId, userId);
    }

    /**
     * Count active creatures in a guild
     */
    static countActiveByGuild(guildId) {
        const db = getDatabase();
        const result = db.prepare(`
            SELECT COUNT(*) as count FROM creatures 
            WHERE guild_id = ? AND status = 'active'
        `).get(guildId);
        return result.count;
    }

    /**
     * Check if guild can add more creatures (based on tier)
     */
    static canAddCreature(guildId, premiumTier = 'free') {
        const count = this.countActiveByGuild(guildId);

        switch (premiumTier) {
            case 'tribe':
                return count < MAX_CREATURES_TRIBE;
            case 'pro':
                return count < MAX_CREATURES_PRO;
            default:
                return count < MAX_CREATURES_FREE;
        }
    }

    /**
     * Update creature status
     */
    static updateStatus(id, status) {
        const db = getDatabase();
        db.prepare(`
            UPDATE creatures SET status = ? WHERE id = ?
        `).run(status, id);
        return this.findById(id);
    }

    /**
     * Mark creature as notified
     */
    static markNotified(id) {
        const db = getDatabase();
        db.prepare(`
            UPDATE creatures SET last_notified_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(id);
    }

    /**
     * Stop tracking a creature
     */
    static stop(id) {
        return this.updateStatus(id, 'stopped');
    }

    /**
     * Stop all creatures for a guild
     */
    static stopAllByGuild(guildId) {
        const db = getDatabase();
        db.prepare(`
            UPDATE creatures SET status = 'stopped' WHERE guild_id = ? AND status = 'active'
        `).run(guildId);
    }

    /**
     * Get creatures needing notification (buffer running low)
     */
    static getCreaturesNeedingAlert(thresholdMinutes = 5) {
        const db = getDatabase();
        return db.prepare(`
            SELECT 
                c.*, 
                COALESCE(c.notify_mode, g.notify_mode) as notify_mode,
                COALESCE(c.notify_channel_id, g.notify_channel_id) as notify_channel_id,
                g.alert_threshold
            FROM creatures c
            INNER JOIN guilds g ON g.id = c.guild_id
            WHERE c.status = 'active'
            AND datetime(c.mature_time, '-' || COALESCE(g.alert_threshold, ?) || ' minutes') <= datetime('now')
            AND (c.last_notified_at IS NULL OR datetime(c.last_notified_at, '+10 minutes') <= datetime('now'))
        `).all(thresholdMinutes);
    }

    /**
     * Cleanup old stopped creatures (older than 7 days)
     */
    static cleanup() {
        const db = getDatabase();
        const result = db.prepare(`
            DELETE FROM creatures 
            WHERE status != 'active' 
            AND datetime(mature_time, '+7 days') < datetime('now')
        `).run();
        return result.changes;
    }
}
