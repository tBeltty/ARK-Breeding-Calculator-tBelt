import { getDatabase } from '../sqlite.js';

/**
 * TrackingRepository
 * Manages server_tracking records in the database.
 */
export class TrackingRepository {
    /**
     * Add a new server to track
     */
    static add(data) {
        const db = getDatabase();
        const stmt = db.prepare(`
            INSERT INTO server_tracking (guild_id, channel_id, server_id, server_name, type, last_status)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            data.guildId,
            data.channelId,
            data.serverId,
            data.serverName,
            data.type || 'official',
            data.lastStatus || 'unknown'
        );
    }

    /**
     * Remove a tracked server
     */
    static remove(guildId, serverId) {
        const db = getDatabase();
        // Robust delete: handles strict ID and potential float-converted ID
        const stmt = db.prepare(`
            DELETE FROM server_tracking 
            WHERE guild_id = ? 
            AND (server_id = ? OR server_id = ?)
        `);
        return stmt.run(guildId, serverId, `${serverId}.0`);
    }

    /**
     * Get all tracked servers for a guild
     */
    static listByGuild(guildId) {
        const db = getDatabase();
        return db.prepare("SELECT * FROM server_tracking WHERE guild_id = ?").all(guildId);
    }

    /**
     * Update the channel for a specific tracked server
     */
    static updateChannel(guildId, serverId, channelId) {
        const db = getDatabase();
        const stmt = db.prepare("UPDATE server_tracking SET channel_id = ? WHERE guild_id = ? AND server_id = ?");
        return stmt.run(channelId, guildId, serverId);
    }

    /**
     * Update the channel for ALL tracked servers in a guild
     */
    static updateAllChannels(guildId, channelId) {
        const db = getDatabase();
        const stmt = db.prepare("UPDATE server_tracking SET channel_id = ? WHERE guild_id = ?");
        return stmt.run(channelId, guildId);
    }

    static isTracked(guildId, serverId) {
        const db = getDatabase();
        const row = db.prepare("SELECT id FROM server_tracking WHERE guild_id = ? AND server_id = ?").get(guildId, serverId);
        return !!row;
    }
}
