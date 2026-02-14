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

            const active = this.queue.shift();
            try {
                const response = await active.requestFn();
                active.resolve(response);
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
                    logger.warn(`API Rate Limit Hit! Pausing queue for ${retryAfter} seconds.`);
                    this.pausedUntil = Date.now() + (retryAfter * 1000);
                    this.queue.unshift(active);
                    active.reject({
                        isRateLimit: true,
                        retryAfter,
                        message: `Rate limit exceeded. Try again in ${retryAfter}s`
                    });
                } else {
                    active.reject(error);
                }
            }

            // Small buffer between requests
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
 * Uses On-Demand polling strategy — only checks tracked servers.
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
        this.pollInterval = setInterval(() => {
            this.sync();
        }, 2 * 60 * 1000);

        logger.info('ServerService started (On-Demand Polling every 2m)');
    }

    /**
     * Synchronize Tracked Servers Only
     * Uses SEQUENTIAL processing (for...of) to avoid flooding the RequestQueue.
     * This was the proven v3.0 pattern.
     */
    async sync() {
        try {
            const db = getDatabase();
            const tracked = db.prepare("SELECT * FROM server_tracking").all();

            if (tracked.length === 0) return;

            logger.info(`[Sync] Syncing status for ${tracked.length} tracked servers...`);

            for (const rawRecord of tracked) {
                // Sanitize ID: remove trailing .0 if present (SQLite/Type issue)
                const record = {
                    ...rawRecord,
                    server_id: String(rawRecord.server_id).replace(/\.0$/, '')
                };

                if (record.type === 'unofficial') {
                    await this.checkUnofficial(record);
                } else {
                    await this.checkOfficial(record);
                }
            }

            await this.processDowntimeAndAlerts(tracked);

        } catch (error) {
            logger.error('Sync cycle failed:', error.message);
        }
    }

    async checkOfficial(record) {
        let match = null;
        try {
            // Strategy: Name search first (most reliable), then ID search as fallback.
            // This is the proven v3.0 strategy.

            // Attempt 1: Name search (Primary — most reliable for official servers)
            if (record.server_name) {
                try {
                    const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                        params: { search: record.server_name, per_page: 5 },
                        headers: { 'X-API-Key': this.apiKey },
                        timeout: 5000
                    }));
                    if (response.data?.success) {
                        // Strict check by ID in results
                        match = response.data.data.find(s => String(s.id) === record.server_id);
                    }
                } catch (e) {
                    if (e.isRateLimit) throw e;
                    logger.warn(`[checkOfficial] Name search failed for "${record.server_name}": ${e.message}`);
                }
            }

            // Attempt 2: Direct ID lookup (ArkStatus IDs are numeric, e.g. 4295132944)
            if (!match && record.server_id && /^\d+$/.test(record.server_id)) {
                try {
                    const response = await this.requestQueue.add(() => axios.get(`https://arkstatus.com/api/v1/servers/${record.server_id}`, {
                        headers: { 'X-API-Key': this.apiKey },
                        timeout: 5000
                    }));
                    if (response.data?.success && response.data.data) {
                        match = response.data.data;
                    }
                } catch (e) {
                    if (e.isRateLimit) throw e;
                    if (e.response?.status !== 404) {
                        logger.warn(`[checkOfficial] Direct ID lookup failed for ${record.server_id}: ${e.message}`);
                    }
                }
            }

            // Attempt 3: ID search as keyword (Fallback)
            if (!match && record.server_id) {
                try {
                    const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                        params: { search: record.server_id, per_page: 5 },
                        headers: { 'X-API-Key': this.apiKey },
                        timeout: 5000
                    }));
                    if (response.data?.success) {
                        match = response.data.data.find(s => String(s.id) === record.server_id);
                    }
                } catch (e) {
                    if (e.isRateLimit) throw e;
                    logger.warn(`[checkOfficial] ID keyword search failed for ${record.server_id}: ${e.message}`);
                }
            }

            if (match) {
                this.statusCache.set(record.server_id, {
                    status: match.status,
                    players: match.players,
                    maxPlayers: match.max_players || 70,
                    map: match.map,
                    name: match.name || record.server_name,
                    lastUpdated: Date.now()
                });
                logger.info(`[Sync] ✓ ${record.server_name || record.server_id}: ${match.status} (${match.players}/${match.max_players || 70})`);
            } else {
                // Verified offline or not found
                this.statusCache.set(record.server_id, {
                    status: 'offline',
                    name: record.server_name,
                    lastUpdated: Date.now()
                });
                logger.warn(`[Sync] ✗ ${record.server_name || record.server_id}: NOT FOUND by any strategy`);
            }
        } catch (error) {
            if (error.isRateLimit) {
                logger.warn(`[Sync] Skipping check for ${record.server_id} due to Rate Limit.`);
                const current = this.statusCache.get(record.server_id);
                if (current?.status === 'syncing') {
                    this.statusCache.set(record.server_id, {
                        status: 'offline',
                        name: record.server_name,
                        lastUpdated: Date.now()
                    });
                }
            } else {
                logger.error(`[Sync] Failed to check official ${record.server_id}:`, error.message);
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
                name: result.name || record.server_name,
                lastUpdated: Date.now()
            });
        } catch (e) {
            this.statusCache.set(record.server_id, {
                status: 'offline',
                name: record.server_name,
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
            if (!this.client) return;

            let targetChannelId = record.channel_id;

            // If the record has no specific channel (or is 'WEB'), use the Guild's global setting.
            if ((!targetChannelId || targetChannelId === 'WEB') && record.guild_id && record.guild_id !== 'WEB') {
                try {
                    const settings = GuildRepository.findById(record.guild_id);
                    if (settings?.notify_channel_id) {
                        targetChannelId = settings.notify_channel_id;
                    }
                } catch (e) {
                    logger.error(`Error fetching guild settings for ${record.guild_id}:`, e.message);
                }
            }

            if (!targetChannelId || targetChannelId === 'WEB') return;

            const channel = await this.client.channels.fetch(targetChannelId).catch(() => null);
            if (!channel) return;

            const name = record.server_name || `Server ${record.server_id}`;
            const embed = EmbedBuilder.createServerStatus(statusInfo, name);

            const message = statusInfo.status === 'online' ?
                `✅ **${name}** is back **ONLINE**!` :
                `⚠️ **${name}** has gone **OFFLINE**!`;

            await channel.send({ content: message, embeds: [embed] });
        } catch (e) {
            logger.error(`Failed to send alert for ${record.server_id}:`, e.message);
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
        let rawApiResults = [];
        try {
            logger.info(`Searching API for: ${query} (Official Only: ${onlyOfficial})`);

            // Direct ID lookup for numeric queries 
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

            // Search query
            const params = { search: query, per_page: 20 };
            if (onlyOfficial) params.official = true;

            const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                params,
                headers: { 'X-API-Key': this.apiKey },
                timeout: 5000
            }));

            if (response.data && response.data.success) {
                response.data.data.forEach(s => {
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
                    type: s.official || s.is_official ? 'official' : 'unofficial',
                    isTracked: !!local,
                    platform: s.platform,
                    version: s.version
                };
            });

            // Merge: API results + Local results that weren't in API
            const combined = [...apiResults];

            localMatches.forEach(local => {
                if (!combined.some(c => String(c.id) === String(local.id))) {
                    if (!onlyOfficial || local.type === 'official') {
                        combined.unshift(local);
                    }
                } else {
                    const idx = combined.findIndex(c => String(c.id) === String(local.id));
                    if (idx !== -1) {
                        combined[idx].isTracked = true;
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
            return localMatches; // Fallback to local results only
        }
    }

    async addTrackedServer(serverId, type = 'unofficial', name = null, guildId = 'WEB', channelId = 'WEB', initialData = null) {
        const db = getDatabase();
        logger.info(`[ServerService] addTrackedServer called for ${serverId} (${type}) Name: ${name} Guild: ${guildId}`);
        try {
            const exists = db.prepare('SELECT id, server_name FROM server_tracking WHERE server_id = ? AND guild_id = ?').get(serverId, guildId);

            if (exists) {
                logger.info(`[ServerService] Server exists in DB. Current Name: ${exists.server_name}. New Name: ${name}`);
                if (name) {
                    db.prepare('UPDATE server_tracking SET server_name = ?, type = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(name, type, exists.id);
                }
            } else {
                db.prepare('INSERT INTO server_tracking (guild_id, channel_id, server_id, type, server_name, last_status) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(guildId, channelId, serverId, type, name || serverId, initialData?.status || 'unknown');
                logger.info(`[ServerService] Inserted new record for guild ${guildId}.`);
            }

            // Initialize/Update cache immediately
            this.statusCache.set(String(serverId), {
                status: initialData?.status || 'syncing',
                name: initialData?.name || name || serverId,
                map: initialData?.map || 'Unknown',
                players: initialData?.players || 0,
                maxPlayers: initialData?.maxPlayers || 70,
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
