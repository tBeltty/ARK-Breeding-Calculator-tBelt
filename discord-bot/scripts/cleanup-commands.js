/**
 * Cleanup Script
 * 
 * This script clears all guild-specific slash commands for the bot.
 * Use this to resolve command duplication issues caused by registering
 * commands both globally and per-guild.
 */

import 'dotenv/config';
import { REST, Routes, Client, GatewayIntentBits } from 'discord.js';
import { logger } from '../src/shared/logger.js';

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    logger.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
    process.exit(1);
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    logger.info(`Starting cleanup for ${client.guilds.cache.size} guilds...`);

    try {
        for (const [guildId, guild] of client.guilds.cache) {
            logger.info(`Clearing commands for guild: ${guild.name} (${guildId})`);

            await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                { body: [] }
            );

            logger.success(`Cleared commands for ${guild.name}`);
        }

        logger.success('Cleanup complete!');
    } catch (error) {
        logger.error('Failed to cleanup commands:', error);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

logger.info('Logging in to Discord for cleanup...');
client.login(process.env.DISCORD_TOKEN);
