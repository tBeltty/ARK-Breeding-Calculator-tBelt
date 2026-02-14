/**
 * Express API Server
 * 
 * Provides REST API for the web dashboard.
 * Runs alongside the Discord bot.
 */

import express from 'express';
import { getDatabase } from '../database/sqlite.js';
import { logger } from '../../shared/logger.js';
import { ratesService } from '../../application/RatesService.js';
import { serverService } from '../../application/ServerService.js';
import { TrackingRepository } from '../database/repositories/TrackingRepository.js';
import { version } from '../../shared/version.js';

const app = express();
const PORT = process.env.API_PORT || 3005;

// Middleware
app.use(express.json());

// CORS for dashboard
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://ark.tbelt.online');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import guildRoutes from './routes/guilds.js';

// API Status Endpoint
app.get('/api/stats', (req, res) => {
    const client = req.app.locals.client;
    res.json({
        version,
        name: 'Arktic Assistant',
        status: client && client.isReady() ? 'running' : 'starting_or_disconnected',
        discord_ready: client ? client.isReady() : false,
        guilds: client ? client.guilds.cache.size : 0
    });
});

// Debug Endpoint for Internal State
app.get('/api/debug', (req, res) => {
    const client = req.app.locals.client;
    const getLastError = req.app.locals.getLastError;

    res.json({
        timestamp: new Date().toISOString(),
        process: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV
        },
        discord: {
            ready: client ? client.isReady() : false,
            status: client ? client.ws.status : 'N/A',
            ping: client ? client.ws.ping : -1,
            guilds: client ? client.guilds.cache.size : 0,
            user: client?.user?.tag || 'none'
        },
        last_error: getLastError ? getLastError() : null
    });
});

app.get('/api/rates', (req, res) => {
    res.json(ratesService.getRates());
});

app.get('/api/servers/search', async (req, res) => {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    // Default to 'official' if type is not specified or is 'official'
    // If type is 'unofficial', pass false for onlyOfficial
    const onlyOfficial = type !== 'unofficial';

    const results = await serverService.findServer(q, onlyOfficial);
    res.json(results || []);
});

app.post('/api/servers/track', async (req, res) => {
    const { serverId, type, name, guildId, channelId, status, map, players, maxPlayers } = req.body;
    if (!serverId) return res.status(400).json({ error: 'Server ID required' });

    // Use default 'WEB' guild if not provided, allowing basic web tracking
    const targetGuild = guildId || 'WEB';
    const targetChannel = channelId || 'WEB';

    const initialData = status ? { status, name, map, players, maxPlayers } : null;

    await serverService.addTrackedServer(serverId, type || 'unofficial', name, targetGuild, targetChannel, initialData);
    res.json({ success: true, message: 'Server added to tracking.' });
});

app.delete('/api/servers/track', async (req, res) => {
    const { serverId, guildId } = req.body;
    if (!serverId) return res.status(400).json({ error: 'Server ID required' });

    const targetGuild = guildId || 'WEB';

    try {
        TrackingRepository.remove(targetGuild, serverId);
        res.json({ success: true, message: 'Server removed from tracking.' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to remove server' });
    }
});

app.patch('/api/servers/:serverId', async (req, res) => {
    const { serverId } = req.params;
    const { channelId, guildId } = req.body; // channelId can be null to reset to default

    if (!guildId) return res.status(400).json({ error: 'Guild ID required for security' });

    try {
        const db = getDatabase();
        // Verify ownership/context? We assume guildId match for now + Auth middleware (if we had it here, but we rely on dashboard context)
        // Ideally we check if record exists for this guild
        const result = db.prepare('UPDATE server_tracking SET channel_id = ? WHERE server_id = ? AND guild_id = ?')
            .run(channelId || null, serverId, guildId);

        if (result.changes === 0) return res.status(404).json({ error: 'Server not found or permission denied' });

        res.json({ success: true });
    } catch (e) {
        logger.error(`Failed to update server ${serverId}:`, e);
        res.status(500).json({ error: 'Update failed' });
    }
});

app.patch('/api/servers/track/channel', async (req, res) => {
    const { guildId, channelId } = req.body;
    if (!guildId || !channelId) return res.status(400).json({ error: 'Guild ID and Channel ID required' });

    try {
        const db = getDatabase();
        const info = db.prepare('UPDATE server_tracking SET channel_id = ? WHERE guild_id = ?').run(channelId, guildId);
        res.json({ success: true, updated: info.changes });
    } catch (e) {
        logger.error('Failed to update tracking channel:', e);
        res.status(500).json({ error: 'Failed to update channel' });
    }
});

app.get('/api/servers/status/:id', (req, res) => {
    const { id } = req.params;
    const status = serverService.getStatus(id);
    if (!status) return res.status(404).json({ error: 'Server not tracked or found' });
    res.json(status);
});

app.get('/api/servers/debug/cache', (req, res) => {
    res.json(Object.fromEntries(serverService.statusCache));
});

app.get('/api/servers/tracked', (req, res) => {
    try {
        const { guildId } = req.query;
        const targetGuild = guildId || 'WEB';

        // Get all servers tracked by the web dashboard or specific guild
        const tracked = TrackingRepository.listByGuild(targetGuild);

        // Enrich with current status from cache
        const enriched = tracked.map(row => {
            const cleanId = String(row.server_id).replace(/\.0$/, '');
            const cache = serverService.getStatus(cleanId);
            return {
                id: cleanId,
                name: row.server_name || cache?.name || `Server ${cleanId}`,
                status: cache?.status || row.last_status,
                type: row.type,
                map: cache?.map || 'Unknown',
                players: cache?.players || 0,
                maxPlayers: cache?.maxPlayers || 70,
                lastUpdated: row.last_updated,
                channel_id: row.channel_id
            };
        });

        res.json(enriched);
    } catch (e) {
        logger.error('Failed to fetch tracked servers:', e.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use('/api/guilds', guildRoutes);

/**
 * Start the API server
 * @param {Client} client - Discord JS Client instance
 * @param {Function} getLastError - Callback to get the last recorded global error
 */
export async function startApi(client, getLastError) {
    // Make variables available to routes
    app.locals.client = client;
    app.locals.getLastError = getLastError;

    return new Promise((resolve) => {
        app.listen(PORT, () => {
            logger.success(`API server running on port ${PORT}`);
            resolve();
        });
    });
}

export { app };
