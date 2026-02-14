import axios from 'axios';
import { GameDig } from 'gamedig';
import { getDatabase } from '../infrastructure/database/sqlite.js';
import { logger } from '../shared/logger.js';
import { EmbedBuilder } from '../infrastructure/discord/EmbedBuilder.js';
import { GuildRepository } from '../infrastructure/database/repositories/GuildRepository.js';

/**
 * RequestQueue
 * Manages outgoing API requests to respect Rate Limits.
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
                    active.reject({ isRateLimit: true, retryAfter, message: `Rate limit exceeded. Try again in ${retryAfter}s` });
                } else {
                    active.reject(error);
                }
            }
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
 */
class ServerService {
    constructor() {
        this.statusCache = new Map();
        this.pollInterval = null;
        this.apiKey = process.env.ARK_STATUS_API_KEY;
        this.client = null;
        this.requestQueue = new RequestQueue();
    }

    start() {
        if (this.pollInterval) return;
        this.sync();
        this.pollInterval = setInterval(() => this.sync(), 2 * 60 * 1000);
        logger.info('ServerService started (On-Demand Polling every 2m)');
    }

    async sync() {
        try {
            const db = getDatabase();
            const tracked = db.prepare("SELECT * FROM server_tracking").all();
            if (tracked.length === 0) return;

            logger.info(`[Sync] Starting status check for ${tracked.length} servers...`);
            await Promise.all(tracked.map(async (rawRecord) => {
                const record = { ...rawRecord, server_id: String(rawRecord.server_id).replace(/\.0$/, '') };
                if (record.type === 'unofficial') {
                    await this.checkUnofficial(record);
                } else {
                    await this.checkOfficial(record);
                }
            }));
            await this.processDowntimeAndAlerts(tracked);
            logger.info('[Sync] All status checks completed.');
        } catch (e) {
            logger.error('Sync failed:', e.message);
        }
    }

    async checkOfficial(record) {
        let match = null;
        try {
            // Attempt 1: Direct ID lookup
            if (record.server_id && /^\d+$/.test(record.server_id)) {
                try {
                    const response = await this.requestQueue.add(() => axios.get(`https://arkstatus.com/api/v1/servers/${record.server_id}`, {
                        headers: { 'X-API-Key': this.apiKey }, timeout: 5000
                    }));
                    if (response.data?.success && response.data.data) {
                        match = response.data.data;
                    }
                } catch (e) {
                    if (e.response?.status !== 404) logger.warn(`Direct ID lookup failed for ${record.server_id}: ${e.message}`);
                }
            }

            // Attempt 2: Search by ID as keyword (Fallback for numeric IDs that aren't PKs)
            if (!match && record.server_id && /^\d+$/.test(record.server_id)) {
                try {
                    const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                        params: { search: record.server_id, per_page: 5, official: true },
                        headers: { 'X-API-Key': this.apiKey }, timeout: 5000
                    }));
                    if (response.data?.success && response.data.data?.length > 0) {
                        match = response.data.data.find(s => String(s.id) === record.server_id);
                    }
                } catch (e) { }
            }

            // Attempt 3: Name search (Fallback)
            if (!match && record.server_name) {
                try {
                    const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                        params: { search: record.server_name, per_page: 20, official: true },
                        headers: { 'X-API-Key': this.apiKey }, timeout: 5000
                    }));
                    if (response.data?.success) {
                        match = response.data.data.find(s => String(s.id) === record.server_id || s.name === record.server_name);
                    }
                } catch (e) { }
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
            } else {
                const current = this.statusCache.get(record.server_id);
                if (!current || current.status === 'syncing' || current.status === 'unknown') {
                    this.statusCache.set(record.server_id, {
                        status: 'offline',
                        name: record.server_name,
                        lastUpdated: Date.now()
                    });
                }
            }
        } catch (error) {
            if (error.isRateLimit) {
                logger.warn(`Skipping check for ${record.server_id} due to Rate Limit. Retry in ${error.retryAfter}s`);
            } else {
                logger.error(`Failed to check official ${record.server_id}:`, error.message);
                const current = this.statusCache.get(record.server_id);
                if (current?.status === 'syncing') {
                    this.statusCache.set(record.server_id, { status: 'offline', name: record.server_name, lastUpdated: Date.now() });
                }
            }
        }
    }

    async checkUnofficial(record) {
        try {
            const [host, port] = record.server_id.split(':');
            const result = await GameDig.query({ type: 'arksa', host, port: parseInt(port) || 27015 });
            this.statusCache.set(record.server_id, {
                status: 'online', players: result.players.length, maxPlayers: result.maxplayers,
                map: result.map, name: result.name || record.server_name, lastUpdated: Date.now()
            });
        } catch (e) {
            this.statusCache.set(record.server_id, { status: 'offline', name: record.server_name, lastUpdated: Date.now() });
        }
    }

    async processDowntimeAndAlerts(trackedRecords) {
        const db = getDatabase();
        for (const record of trackedRecords) {
            const current = this.statusCache.get(record.server_id);
            if (!current) continue;
            if (current.status !== record.last_status) {
                logger.info(`Server ${record.server_id} changed: ${record.last_status} -> ${current.status}`);
                db.prepare("UPDATE server_tracking SET last_status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?").run(current.status, record.id);
                this.emitAlert(record, current);
            }
        }
    }

    async emitAlert(record, statusInfo) {
        try {
            if (!this.client) return;
            let targetChannelId = record.channel_id;
            if ((!targetChannelId || targetChannelId === 'WEB') && record.guild_id && record.guild_id !== 'WEB') {
                try {
                    const settings = GuildRepository.findById(record.guild_id);
                    if (settings?.notify_channel_id) targetChannelId = settings.notify_channel_id;
                } catch (e) { }
            }
            if (!targetChannelId || targetChannelId === 'WEB') return;
            const channel = await this.client.channels.fetch(targetChannelId).catch(() => null);
            if (!channel) return;
            const name = record.server_name || `Server ${record.server_id}`;
            const embed = EmbedBuilder.createServerStatus(statusInfo, name);
            const message = statusInfo.status === 'online' ? `✅ **${name}** is back **ONLINE**!` : `⚠️ **${name}** has gone **OFFLINE**!`;
            await channel.send({ content: message, embeds: [embed] });
        } catch (e) {
            logger.error(`Failed to emit alert for ${record.server_id}:`, e.message);
        }
    }

    setClient(client) { this.client = client; }

    async findServer(query, onlyOfficial = true) {
        if (!query) return [];
        const db = getDatabase();
        const localMatches = db.prepare("SELECT * FROM server_tracking WHERE server_id LIKE ? OR server_name LIKE ?")
            .all(`%${query}%`, `%${query}%`)
            .map(row => {
                const cleanId = String(row.server_id).replace(/\.0$/, '');
                const cache = this.statusCache.get(cleanId);
                return {
                    id: cleanId, name: row.server_name, map: cache?.map || 'Unknown',
                    players: cache?.players || 0, maxPlayers: cache?.maxPlayers || 70,
                    status: cache?.status || row.last_status, type: row.type, isTracked: true
                };
            });

        let rawApiResults = [];
        try {
            if (onlyOfficial && /^\d+$/.test(String(query))) {
                try {
                    const idResponse = await this.requestQueue.add(() => axios.get(`https://arkstatus.com/api/v1/servers/${query}`, {
                        headers: { 'X-API-Key': this.apiKey }, timeout: 5000
                    }));
                    if (idResponse.data?.success && idResponse.data.data) rawApiResults.push(idResponse.data.data);
                } catch (e) { }
            }
            const response = await this.requestQueue.add(() => axios.get('https://arkstatus.com/api/v1/servers', {
                params: { search: query, per_page: 20, official: onlyOfficial || undefined },
                headers: { 'X-API-Key': this.apiKey }, timeout: 5000
            }));
            if (response.data?.success) {
                response.data.data.forEach(s => {
                    if (!rawApiResults.some(a => String(a.id) === String(s.id))) rawApiResults.push(s);
                });
            }
            const apiResults = rawApiResults.map(s => {
                const local = localMatches.find(l => String(l.id) === String(s.id));
                return {
                    id: String(s.id), name: s.name, map: s.map || 'Unknown',
                    players: s.players || 0, maxPlayers: s.max_players || 70,
                    status: s.status || 'unknown', type: s.official || s.is_official ? 'official' : 'unofficial',
                    isTracked: !!local, platform: s.platform, version: s.version
                };
            });
            const combined = [...apiResults];
            localMatches.forEach(local => {
                if (!combined.some(c => String(c.id) === String(local.id))) {
                    if (!onlyOfficial || local.type === 'official') combined.unshift(local);
                }
            });
            return combined;
        } catch (e) { return localMatches; }
    }

    async addTrackedServer(serverId, type = 'unofficial', name = null, guildId = 'WEB', channelId = 'WEB', initialData = null) {
        const db = getDatabase();
        try {
            const exists = db.prepare('SELECT id FROM server_tracking WHERE server_id = ? AND guild_id = ?').get(serverId, guildId);
            if (exists) {
                if (name) db.prepare('UPDATE server_tracking SET server_name = ?, type = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?').run(name, type, exists.id);
            } else {
                db.prepare('INSERT INTO server_tracking (guild_id, channel_id, server_id, type, server_name, last_status) VALUES (?, ?, ?, ?, ?, ?)')
                    .run(guildId, channelId, serverId, type, name || serverId, initialData?.status || 'unknown');
            }
            this.statusCache.set(String(serverId), {
                status: initialData?.status || 'syncing', name: initialData?.name || name || serverId,
                map: initialData?.map || 'Unknown', players: initialData?.players || 0,
                maxPlayers: initialData?.maxPlayers || 70, lastUpdated: Date.now()
            });
            this.sync();
        } catch (e) { logger.error(`Failed to add tracked server ${serverId}:`, e.message); }
    }

    getStatus(serverId) { return this.statusCache.get(String(serverId)); }
}

export const serverService = new ServerService();
