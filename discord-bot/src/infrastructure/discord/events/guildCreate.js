/**
 * Guild Create Event
 * 
 * Fired when the bot joins a new server.
 * Creates the guild record in the database.
 */

import { Events } from 'discord.js';
import { logger } from '../../../shared/logger.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';

export const name = Events.GuildCreate;

export async function execute(guild) {
    logger.info(`Joined new guild: ${guild.name} (${guild.id})`);

    // Create guild record in database
    GuildRepository.findOrCreate(guild.id);

    logger.success(`Guild ${guild.name} initialized in database`);
}
