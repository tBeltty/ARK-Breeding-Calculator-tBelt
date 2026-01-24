/**
 * Ready Event
 * 
 * Fired once when the bot successfully connects to Discord.
 */

import { Events, ActivityType } from 'discord.js';
import { logger } from '../../../shared/logger.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guilds`);

    // Set bot status
    client.user.setActivity('your dinos grow 🦖', { type: ActivityType.Watching });
}
