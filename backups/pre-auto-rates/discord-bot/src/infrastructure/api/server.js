/**
 * Express API Server
 * 
 * Provides REST API for the web dashboard.
 * Runs alongside the Discord bot.
 */

import express from 'express';
import { logger } from '../../shared/logger.js';

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
