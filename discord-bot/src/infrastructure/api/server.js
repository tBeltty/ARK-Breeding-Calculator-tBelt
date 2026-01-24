/**
 * Express API Server
 * 
 * Provides REST API for the web dashboard.
 * Runs alongside the Discord bot.
 */

import express from 'express';
import { logger } from '../../shared/logger.js';
import { ratesService } from '../../application/RatesService.js';
import { serverService } from '../../application/ServerService.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

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

// API routes
app.get('/api/stats', (req, res) => {
    res.json({
        version: '3.0.0',
        status: 'running',
    });
});

app.get('/api/rates', (req, res) => {
    res.json(ratesService.getRates());
});

app.get('/api/servers/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const results = await serverService.findServer(q);
    res.json(results || []);
});

app.post('/api/servers/track', async (req, res) => {
    const { serverId, type, name } = req.body;
    if (!serverId) return res.status(400).json({ error: 'Server ID required' });

    await serverService.addTrackedServer(serverId, type || 'unofficial', name);
    res.json({ success: true, message: 'Server added to tracking.' });
});

app.get('/api/servers/status/:id', (req, res) => {
    const { id } = req.params;
    const status = serverService.getStatus(id);
    if (!status) return res.status(404).json({ error: 'Server not tracked or found' });
    res.json(status);
});

app.use('/api/guilds', guildRoutes);

/**
 * Start the API server
 * @param {Client} client - Discord JS Client instance
 */
export async function startApi(client) {
    // Make client available to routes
    app.locals.client = client;

    return new Promise((resolve) => {
        app.listen(PORT, () => {
            logger.success(`API server running on port ${PORT}`);
            resolve();
        });
    });
}

export { app };
