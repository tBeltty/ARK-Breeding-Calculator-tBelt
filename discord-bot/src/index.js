/**
 * ARK Breeding Assistant - Discord Bot
 * Entry Point
 * 
 * This file bootstraps the application:
 * 1. Loads environment variables
 * 2. Initializes database connection
 * 3. Sets up Discord client
 * 4. Starts the Express API (for dashboard)
 */

import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { initializeDatabase } from './infrastructure/database/sqlite.js';
import { loadCommands } from './infrastructure/discord/commandLoader.js';
import { loadEvents } from './infrastructure/discord/eventLoader.js';
import { startApi } from './infrastructure/api/server.js';
import { startNotificationScheduler } from './application/NotificationScheduler.js';
import { ratesService } from './application/RatesService.js';
import { serverService } from './application/ServerService.js';
import { logger } from './shared/logger.js';

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Create Discord client with minimal required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Required for guild info
    ],
});

// Attach collections for commands
client.commands = new Collection();

// Bootstrap application
async function main() {
    try {
        logger.info('🚀 Starting Arktic Assistant...');

        // 1. Initialize Database
        logger.info('📦 Initializing database...');
        await initializeDatabase();

        // 2. Load Commands
        logger.info('⚡ Loading commands...');
        await loadCommands(client);


        // 3. Load Event Handlers
        logger.info('🎧 Loading event handlers...');
        await loadEvents(client);

        // 4. Login to Discord
        logger.info('🔑 Logging into Discord...');
        await client.login(process.env.DISCORD_TOKEN);

        // 5. Start API Server (for dashboard)
        if (process.env.NODE_ENV !== 'test') {
            logger.info('🌐 Starting API server...');
            await startApi(client);
        }

        // 6. Start Notification Scheduler
        logger.info('⏰ Starting notification scheduler...');
        startNotificationScheduler(client);

        // 7. Start Official Rates Service
        logger.info('📊 Starting official rates service...');
        ratesService.loadFromDb();
        ratesService.start();

        // 8. Start Server Monitoring Service
        logger.info('🛰️ Starting server monitoring service...');
        serverService.setClient(client);
        serverService.start();

        logger.info('✅ Arktic Assistant is ready!');
    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down...');
    client.destroy();
    process.exit(0);
});

// Start the application
main();
