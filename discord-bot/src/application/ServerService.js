import axios from 'axios';
import { GameDig } from 'gamedig';
import { getDatabase } from '../infrastructure/database/sqlite.js';
import { logger } from '../shared/logger.js';
import { EmbedBuilder } from '../infrastructure/discord/EmbedBuilder.js';
import { GuildRepository } from '../infrastructure/database/repositories/GuildRepository.js';

/**
 * RequestQueue
 * 
 * Manages outgoing API requests to respect Rate Limits.
 * Pauses execution when 429 is encountered.
 */
class RequestQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.pausedUntil = 0;
    }

    /**
     * Enqueue a request
     * @param {Function} requestFn Async function that returns the axios promise
     * @returns {Promise<any>}
     */
    add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.isProcessing) return;
        if (this.isPaused()) {
            const waitTime = this.pausedUntil - Date.now();
            if (waitTime > 0) {
                setTimeout(() => this.process(), waitTime);
                return;
            }
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            if (this.isPaused()) {
                const waitTime = this.pausedUntil - Date.now();
                setTimeout(() => {
                    this.isProcessing = false;
                    this.process();
                }, waitTime);
                return;
            }

            const active = this.queue.shift(); // FIFO
            try {
                const response = await active.requestFn();
                active.resolve(response);
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    // RATE LIMIT HIT
                    const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
                    logger.warn(`API Rate Limit Hit! Pausing queue for ${retryAfter} seconds.`);

                    this.pausedUntil = Date.now() + (retryAfter * 1000);

                    // Put the failed request back at the front
                    this.queue.unshift(active);

                    // Propagate a special error to the caller so they can show UI feedback, 
                    // BUT we also loop and retry it natively over time? 
                    // No, for "Search" we want immediate feedback.
                    // For "Sync" we want infinite retry.
                    // Let's reject the promise with specific metadata.

                    // If it's a user interaction (Search), we reject so UI shows "Wait 60s".
                    // If it's background (Sync), the caller handles the reject.
                    active.reject({
                        isRateLimit: true,
                        retryAfter,
                        message: `Rate limit exceeded. Try again in ${retryAfter}s`
                    });
                } else {
                    active.reject(error);
                }
            }

            // Small buffer between requests to be nice
            await new Promise(r => setTimeout(r, 1000));
        }

        this.isProcessing = false;
    }

    isPaused() {
        return Date.now() < this.pausedUntil;
    }
}

/**
 * ServerService
 * Handles monitoring of Official and Unofficial ARK servers.
 * switch to On-Demand strategy.
 */
class ServerService {
    constructor() {
        this.statusCache = new Map(); // serverId -> status info
        this.pollInterval = null;
        this.apiKey = process.env.ARK_STATUS_API_KEY;
        this.client = null;
        this.requestQueue = new RequestQueue();
    }

    /**
     * Start the monitoring service
     */
    start() {
        if (this.pollInterval) return;

        // Perform initial poll
        this.sync();

        // Sync local tracked servers every 2 minutes
        // We can poll more frequently now because we check FEWER servers.
        this.pollInterval = setInterval(() => {
            this.sync();
        }, 2 * 60 * 1000);

        logger.info('ServerService started (On-Demand Polling every 2m)');
    }

    /**
     * Synchronize Tracked Servers Only
     */
    async sync() {
        try {
            const db = getDatabase();
            // Get all tracked servers
            const tracked = db.prepare("SELECT * FROM server_tracking").all();

            if (tracked.length === 0) return;

            logger.info(`Syncing status for ${tracked.length} tracked servers...`);

            for (const rawRecord of tracked) {
                // Sanitize ID: remove trailing .0 if present (SQLite/Type issue)
                const record = {
                    ...rawRecord,
                    server_id: String(rawRecord.server_id).replace(/\.0$/, '')
                };

                if (record.type === 'unofficial') {
                    logger.info(`[Sync] Checking Unofficial: ${record.server_id}`);
                    await this.checkUnofficial(record);
                } else {
                    logger.info(`[Sync] Checking Official: ${record.server_id} (${record.server_name})`);
                    await this.checkOfficial(record);
                }
            }

            await this.processDowntimeAndAlerts(tracked);

        } catch (error) {
            logger.error('Sync cycle failed:', error.message);
        }
    }

    async checkOfficial(record) {
        try {
            // Strategy 1: Direct ID Lookup (Most reliable and fast)
            // Strategy 2: Search by Name (Fallback)

            let match = null;

            // Attempt 1: Direct ID lookup (Official IDs are numeric strings)
            if (record.server_id && /^\d+$/.test(record.server_id)) {
                try {
                    const response = await this.requestQueue.add(() => axios.get(`https://arkstatus.com/api/v1/servers/${record.server_id}`, {
                        headers: { 'X-API-Key': this.apiKey },
                        timeout: 5000
                    }));
                    if (response.data?.success && response.data.data) {
                        match = response.data.data;
                        logger.info(`[Sync] Found official server by direct ID: ${match.name}`);
                    }
                } catch (e) {
                    if (e.response?.status !== 404) {
                        logger.warn(`Direct ID lookup failed for ${record.server_id}: ${e.message}`);
                    }
                }
            }

            // Attempt 2: Name search (Fallback)
            if (!match && record.server_name) {
                try {
                    const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                        params: { search: record.server_name, per_page: 20, official: true },
                        headers: { 'X-API-Key': this.apiKey },
                        timeout: 5000
                    }));
                    if (response.data?.success) {
                        match = response.data.data.find(s =>
                            String(s.id) === record.server_id ||
                            s.name === record.server_name
                        );
                    }
                } catch (e) { /* ignore and try next */ }
            }

            if (match) {
                this.statusCache.set(record.server_id, {
                    status: match.status,
                    players: match.players,
                    maxPlayers: match.max_players || 70, // Default to 70 for official
                    map: match.map,
                    name: match.name || record.server_name, // Prefer API name, fallback to record
                    lastUpdated: Date.now()
                });
            } else {
                // Verified offline or not found
                this.statusCache.set(record.server_id, {
                    status: 'offline',
                    name: record.server_name, // STAY WITH THE PERSISTED NAME
                    lastUpdated: Date.now()
                });
            }
        } catch (error) {
            if (error.isRateLimit) {
                logger.warn(`Skipping check for ${record.server_id} due to Rate Limit.`);
                // If we are stuck in 'syncing', we should probably show 'offline' or 'limited' instead of hanging
                // But generally rate limit means "try again later".
                // Let's set it to 'offline' so the UI doesn't look broken, or keep old status?
                // If status is 'syncing', it looks broken.
                const current = this.statusCache.get(record.server_id);
                if (current?.status === 'syncing') {
                    this.statusCache.set(record.server_id, {
                        status: 'offline',
                        name: record.server_name,
                        lastUpdated: Date.now()
                    });
                }
            } else {
                logger.error(`Failed to check official ${record.server_id}:`, error.message);
                // Ensure we don't stay in 'syncing' forever on error
                this.statusCache.set(record.server_id, {
                    status: 'offline',
                    name: record.server_name,
                    lastUpdated: Date.now()
                });
            }
        }
    }

    async checkUnofficial(record) {
        try {
            const [host, port] = record.server_id.split(':');
            const result = await GameDig.query({
                type: 'arksa',
                host,
                port: parseInt(port) || 27015
            });

            this.statusCache.set(record.server_id, {
                status: 'online',
                players: result.players.length,
                maxPlayers: result.maxplayers,
                map: result.map,
                name: result.name || record.server_name, // CACHE NAME
                lastUpdated: Date.now()
            });
        } catch (e) {
            this.statusCache.set(record.server_id, {
                status: 'offline',
                name: record.server_name, // CACHE NAME
                lastUpdated: Date.now()
            });
        }
    }

    /**
     * Detect status transitions and trigger alerts
     */
    async processDowntimeAndAlerts(trackedRecords) {
        const db = getDatabase();

        for (const record of trackedRecords) {
            const current = this.statusCache.get(record.server_id);
            if (!current) continue;

            if (current.status !== record.last_status) {
                logger.info(`Server ${record.server_id} changed: ${record.last_status} -> ${current.status}`);

                // Update DB
                db.prepare("UPDATE server_tracking SET last_status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?")
                    .run(current.status, record.id);

                // Notify Discord
                this.emitAlert(record, current);
            }
        }
    }

    async emitAlert(record, statusInfo) {
        try {
            if (!this.client) {
                logger.warn(`Cannot send alert for ${record.server_id}: Discord client not initialized.`);
                return;
            }

            let targetChannelId = record.channel_id;

            // Priority: Specific Channel Override > Guild Global Setting
            // If the record has no specific channel (or is just 'WEB'), use the Global Setting.
            if ((!targetChannelId || targetChannelId === 'WEB') && record.guild_id && record.guild_id !== 'WEB') {
                try {
                    const settings = GuildRepository.findById(record.guild_id);
                    if (settings && settings.notify_channel_id) {
                        targetChannelId = settings.notify_channel_id;
                        logger.info(`Using global notify channel ${targetChannelId} for guild ${record.guild_id}`);
                    }
                } catch (e) {
                    logger.error(`Error fetching guild settings for ${record.guild_id}:`, e.message);
                }
            }

            if (!targetChannelId || targetChannelId === 'WEB') {
                logger.debug(`Skipping notification for ${record.server_id}: No valid Discord channel configured (Mode: WEB/None).`);
                return;
            }

            const channel = await this.client.channels.fetch(targetChannelId).catch(err => {
                logger.error(`Failed to fetch channel ${targetChannelId}: ${err.message}`);
                return null;
            });

            if (!channel) {
                logger.warn(`Could not find channel ${targetChannelId} for server alert ${record.server_id}. Check bot permissions.`);
                return;
            }

            const name = record.server_name || `Server ${record.server_id}`;
            const embed = EmbedBuilder.createServerStatus(statusInfo, name);

            const message = statusInfo.status === 'online' ?
                `✅ **${name}** is back **ONLINE**!` :
                `⚠️ **${name}** has gone **OFFLINE**!`;

            await channel.send({ content: message, embeds: [embed] });
            logger.info(`Alert sent to channel ${targetChannelId} for server ${name} (${statusInfo.status})`);
        } catch (e) {
            logger.error(`Failed to emit alert for ${record.server_id}:`, e.message);
        }
    }

    setClient(client) {
        this.client = client;
    }

    /**
     * Find a server by ID or Name (Live API)
     */
    async findServer(query, onlyOfficial = true) {
        if (!query) return [];

        // 1. Check Local Tracking first (Instant)
        const db = getDatabase();
        const localMatches = db.prepare("SELECT * FROM server_tracking WHERE server_id LIKE ? OR server_name LIKE ?")
            .all(`%${query}%`, `%${query}%`)
            .map(row => {
                const cleanId = String(row.server_id).replace(/\.0$/, '');
                const cache = this.statusCache.get(cleanId);
                return {
                    id: cleanId,
                    name: row.server_name,
                    map: cache?.map || 'Unknown',
                    players: cache?.players || 0,
                    maxPlayers: cache?.maxPlayers || 70,
                    status: cache?.status || row.last_status,
                    type: row.type,
                    isTracked: true
                };
            });

        // 2. Query External API
        let rawApiResults = []; // Temporary array to hold raw API objects before mapping
        try {
            logger.info(`Searching API for: ${query} (Official Only: ${onlyOfficial})`);

            // Attempt 1: Direct ID lookup (Official IDs are numeric)
            if (onlyOfficial && /^\d+$/.test(String(query))) {
                try {
                    const idResponse = await this.requestQueue.add(() => axios.get(`https://arkstatus.com/api/v1/servers/${query}`, {
                        headers: { 'X-API-Key': this.apiKey },
                        timeout: 5000
                    }));
                    if (idResponse.data?.success && idResponse.data.data) {
                        rawApiResults.push(idResponse.data.data);
                    }
                } catch (e) { /* ignore and try search */ }
            }

            const params = { search: query, per_page: 20 };
            if (onlyOfficial) {
                params.official = true;
            }

            const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                params,
                headers: { 'X-API-Key': this.apiKey },
                timeout: 5000
            }));

            if (response.data && response.data.success) {
                // Merge with ID result if not already there
                const searchResults = response.data.data;
                searchResults.forEach(s => {
                    if (!rawApiResults.some(a => String(a.id) === String(s.id))) {
                        rawApiResults.push(s);
                    }
                });
            }

            // Map results to unified structure
            const apiResults = rawApiResults.map(s => {
                const local = localMatches.find(l => String(l.id) === String(s.id));
                return {
                    id: String(s.id),
                    name: s.name,
                    map: s.map || 'Unknown',
                    players: s.players || 0,
                    maxPlayers: s.max_players || 70,
                    status: s.status || 'unknown',
                    type: s.official || s.is_official ? 'official' : 'unofficial', // API can return 'official' or 'is_official'
                    isTracked: !!local,
                    platform: s.platform,
                    version: s.version
                };
            });

            // Merge: API results + Local results that weren't in API (e.g. unofficials not found by search)
            // Deduplicate by ID
            const combined = [...apiResults];

            localMatches.forEach(local => {
                if (!combined.some(c => String(c.id) === String(local.id))) {
                    if (!onlyOfficial || local.type === 'official') {
                        combined.unshift(local);
                    }
                }
            });

            return combined;

        } catch (e) {
            if (e.isRateLimit) {
                logger.warn(`Search failed due to rate limit: ${e.retryAfter}s`);
                return { error: 'RATE_LIMIT', retryAfter: e.retryAfter };
            }
            logger.error('API Search failed:', e.message);
            return localMatches; // Fallback to local results only on search error
        }
    }

    async addTrackedServer(serverId, type = 'unofficial', name = null, guildId = 'WEB', channelId = 'WEB') {
        const db = getDatabase();
        logger.info(`[ServerService] addTrackedServer called for ${serverId} (${type}) Name: ${name} Guild: ${guildId}`);
        try {
            const exists = db.prepare('SELECT id, server_name FROM server_tracking WHERE server_id = ? AND guild_id = ?').get(serverId, guildId);

            if (exists) {
                logger.info(`[ServerService] Server exists in DB. Current Name: ${exists.server_name}. New Name: ${name}`);
                // SELF-HEAL: If it exists, update the name!
                if (name) {
                    const info = db.prepare('UPDATE server_tracking SET server_name = ?, type = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(name, type, exists.id);
                    logger.info(`[ServerService] Update result: ${info.changes} changes.`);
                }
            } else {
                db.prepare('INSERT INTO server_tracking (guild_id, channel_id, server_id, type, server_name, last_status) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(guildId, channelId, serverId, type, name || serverId, 'unknown');
                logger.info(`[ServerService] Inserted new record for guild ${guildId}.`);
            }

            // Initialize/Update cache immediately
            logger.info(`[ServerService] Updating cache for ${serverId} with status: syncing`);
            this.statusCache.set(String(serverId), {
                status: 'syncing',
                name: name || serverId,
                lastUpdated: Date.now()
            });

            // Trigger immediate check
            this.sync();
        } catch (e) {
            logger.error(`Failed to add tracked server ${serverId}:`, e.message);
        }
    }

    getStatus(serverId) {
        return this.statusCache.get(String(serverId));
    }
}

export const serverService = new ServerService();
