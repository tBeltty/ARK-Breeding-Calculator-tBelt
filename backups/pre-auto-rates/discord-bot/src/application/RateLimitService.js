import { getDatabase } from '../infrastructure/database/sqlite.js';
import { logger } from '../shared/logger.js';

/**
 * Rate Limit Service
 * 
 * Prevents abuse by limiting the number of actions a user can perform in a window.
 */
export class RateLimitService {
    /**
     * Check if a key is within its rate limit
     * 
     * @param {string} key Unique identifier (e.g. user ID + command)
     * @param {number} limit Max allowed actions in the window
     * @param {number} windowSeconds Window size in seconds
     * @returns {Promise<boolean>} True if allowed, false if limited
     */
    static async check(key, limit, windowSeconds) {
        const db = getDatabase();
        const now = new Date();
        const windowStart = new Date(now.getTime() - windowSeconds * 1000);

        try {
            // Find existing rate limit record
            let record = db.prepare('SELECT * FROM rate_limits WHERE key = ?').get(key);

            if (!record || new Date(record.window_start) < windowStart) {
                // Reset or create new window
                db.prepare(`
                    INSERT OR REPLACE INTO rate_limits (key, count, window_start)
                    VALUES (?, 1, ?)
                `).run(key, now.toISOString());
                return true;
            }

            if (record.count >= limit) {
                logger.warn(`Rate limit exceeded for key: ${key}`);
                return false;
            }

            // Increment count in current window
            db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key);
            return true;
        } catch (error) {
            logger.error(`RateLimit Error for ${key}:`, error);
            return true; // Fail open to avoid blocking users on DB errors
        }
    }
}
