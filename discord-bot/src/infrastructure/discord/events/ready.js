/**
 * Ready Event
 * 
 * Fired once when the bot successfully connects to Discord.
 */

import { Events, ActivityType } from 'discord.js';
import { logger } from '../../../shared/logger.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { registerCommands } from '../commandLoader.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);

    // Register commands (Global + Guilds) now that the client is ready
    await registerCommands(client);

    logger.info(`Serving ${client.guilds.cache.size} guilds`);


    // Sync guilds to database to prevent 404s in dashboard
    for (const guild of client.guilds.cache.values()) {
        GuildRepository.findOrCreate(guild.id);
    }
    logger.success('Mutual guilds synchronized with database');

    // Set bot status
    client.user.setActivity('your dinos grow 🦖', { type: ActivityType.Watching });
}
