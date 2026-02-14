import { getDatabase } from '../sqlite.js';

/**
 * NewsRepository
 * Manages RSS news subscriptions in the database.
 */
export class NewsRepository {
    /**
     * Subscribe a guild/channel to news updates
     */
    static subscribe(guildId, channelId) {
        const db = getDatabase();
        const stmt = db.prepare(`
            INSERT INTO news_subscriptions (guild_id, channel_id, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id,
                updated_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(guildId, channelId);
    }

    /**
     * Unsubscribe a guild from news updates
     */
    static unsubscribe(guildId) {
        const db = getDatabase();
        const stmt = db.prepare("DELETE FROM news_subscriptions WHERE guild_id = ?");
        return stmt.run(guildId);
    }

    /**
     * Update the last processed post GUID for a guild
     */
    static updateLastPost(guildId, guid) {
        const db = getDatabase();
        const stmt = db.prepare("UPDATE news_subscriptions SET last_post_guid = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?");
        return stmt.run(guid, guildId);
    }

    /**
     * Get prescription for a guild
     */
    static getSubscription(guildId) {
        const db = getDatabase();
        return db.prepare("SELECT * FROM news_subscriptions WHERE guild_id = ?").get(guildId);
    }

    /**
     * List all active news subscriptions
     */
    static listAll() {
        const db = getDatabase();
        return db.prepare("SELECT * FROM news_subscriptions").all();
    }
}
