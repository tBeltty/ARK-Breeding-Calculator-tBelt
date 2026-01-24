/**
 * Interaction Create Event
 * 
 * Handles all slash command interactions.
 * Includes rate limiting and error handling.
 */

import { Events } from 'discord.js';
import { logger } from '../../../shared/logger.js';
import { checkRateLimit } from '../../../shared/rateLimiter.js';
import { createErrorEmbed } from '../../../shared/embeds.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
    // Handle autocomplete
    if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (command && command.autocomplete) {
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error(`Autocomplete error for /${interaction.commandName}:`, error);
            }
        }
        return;
    }

    // Only handle slash commands
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
    }

    // Rate limiting check
    const rateLimitKey = `user:${interaction.user.id}`;
    const isRateLimited = checkRateLimit(rateLimitKey, {
        maxRequests: 30,
        windowMs: 60000, // 1 minute
    });

    if (isRateLimited) {
        await interaction.reply({
            embeds: [createErrorEmbed('Rate Limited', 'You are sending commands too fast. Please wait a moment.')],
            ephemeral: true,
        });
        return;
    }

    try {
        logger.debug(`Executing command: /${interaction.commandName} by ${interaction.user.tag}`);
        await command.execute(interaction);
    } catch (error) {
        logger.error(`Error executing /${interaction.commandName}:`, error);

        const errorEmbed = createErrorEmbed(
            'Command Error',
            'An error occurred while executing this command.'
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}
