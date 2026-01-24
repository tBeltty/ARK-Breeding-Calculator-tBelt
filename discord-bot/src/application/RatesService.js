import axios from 'axios';
import { getDatabase } from '../infrastructure/database/sqlite.js';
import { logger } from '../shared/logger.js';

/**
 * RatesService
 * Handles fetching, caching, and timestamping official ARK server rates.
 */
class RatesService {
    constructor() {
        this.cache = {
            maturation: 1.0,
            hatch: 1.0,
            consumption: 1.0,
            lastChangedAt: Date.now()
        };
        this.apiKey = process.env.ARK_STATUS_API_KEY;
        this.pollInterval = null;
    }

    /**
     * Start the polling service
     */
    start() {
        if (this.pollInterval) return;

        // Initial fetch
        this.fetchRates();

        // Standard poll: every hour
        // We calculate if we are in a "critical window" (Fri-Mon) inside fetchRates
        this.pollInterval = setInterval(() => {
            this.fetchRates();
        }, 3600000); // 1 hour

        logger.info('RatesService started (Polling every hour)');
    }

    /**
     * Fetch rates from external source (Scraping Fallback)
     */
    async fetchRates() {
        try {
            logger.info('Fetching official ARK rates (Scraping)...');
            // We use the public rates page instead of the private API which proved unreliable
            const response = await axios.get('https://arkstatus.com/rates', {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ArkticBot/3.0; +https://ark.tbelt.online)'
                }
            });

            if (response.data) {
                this.processHtmlRates(response.data);
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                logger.warn('Official rates fetch timed out.');
            } else {
                logger.error('Failed to fetch official rates:', error.message);
            }
        }
    }

    /**
     * Parse HTML content to extract rates
     */
    processHtmlRates(html) {
        // Regex to find rate cards: <h4 ...>Name</h4> ... <div ...>Value</div>
        const regex = /<h4[^>]*>([^<]+)<\/h4>[\s\S]*?<div[^>]*class="rate-value[^"]*"[^>]*>\s*([\d.]+)x/g;

        const extracted = {};
        let match;
        while ((match = regex.exec(html)) !== null) {
            const label = match[1].trim();
            const value = parseFloat(match[2]);
            extracted[label] = value;
        }

        if (Object.keys(extracted).length === 0) {
            logger.warn('No rates found in HTML response.');
            return;
        }

        // Map to internal schema
        const mapped = {
            maturation: extracted['Baby Mature Speed'] || extracted['Maturation'] || 1.0,
            hatch: extracted['Egg Hatch Speed'] || extracted['Hatch'] || 1.0,
            consumption: 1.0 // Usually static, defaulting to 1
        };

        // Check for changes
        const hasChanged =
            mapped.maturation !== this.cache.maturation ||
            mapped.hatch !== this.cache.hatch;

        // Force update regardless of change on first load to ensure cache is hot
        this.cache = {
            ...this.cache,
            ...mapped,
            lastChangedAt: Date.now()
        };
        this.persistToDb(); // Always persist latest known

        if (hasChanged) {
            logger.info(`Rates updated! Maturation: ${mapped.maturation}x, Hatch: ${mapped.hatch}x`);
        } else {
            logger.debug(`Rates verified: M:${mapped.maturation}x H:${mapped.hatch}x (No change)`);
        }
    }

    /**
     * Persist current rates to database
     */
    persistToDb() {
        try {
            const db = getDatabase();
            // Using a simple key-value storage in guilds table or a new settings table
            // For now, let's use a dedicated 'global_settings' table or reuse rate_limits for generic storage
            db.exec(`
                CREATE TABLE IF NOT EXISTS global_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const stmt = db.prepare('INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)');
            stmt.run('official_rates', JSON.stringify(this.cache));
        } catch (e) {
            logger.error('Failed to persist rates to DB:', e.message);
        }
    }

    /**
     * Load initial rates from DB
     */
    loadFromDb() {
        try {
            const db = getDatabase();
            const row = db.prepare('SELECT value FROM global_settings WHERE key = ?').get('official_rates');
            if (row) {
                this.cache = JSON.parse(row.value);
                logger.info(`Loaded official rates from DB cache (M:${this.cache.maturation}x).`);
            }
        } catch (e) {
            // Table might not exist yet, that's fine
        }
    }

    /**
     * Get current cached rates
     */
    getRates() {
        return this.cache;
    }
}

export const ratesService = new RatesService();
