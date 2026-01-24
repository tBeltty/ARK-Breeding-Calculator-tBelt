/**
 * /stop Command
 * 
 * Stop tracking a specific creature by ID.
 */

import { SlashCommandBuilder } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createSuccessEmbed, createErrorEmbed } from '../../../shared/embeds.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop tracking a creature')
    .addIntegerOption(option =>
        option
            .setName('id')
            .setDescription('The creature ID (from /status)')
            .setRequired(true)
    );

export async function execute(interaction) {
    const id = interaction.options.getInteger('id');

    // Find the creature
    const creature = CreatureRepository.findById(id);

    if (!creature) {
        await interaction.reply({
            embeds: [createErrorEmbed('Not Found', `No creature found with ID \`${id}\`.`)],
            ephemeral: true,
        });
        return;
    }

    // Verify it belongs to this guild
    if (creature.guild_id !== interaction.guildId) {
        await interaction.reply({
            embeds: [createErrorEmbed('Access Denied', 'This creature belongs to a different server.')],
            ephemeral: true,
        });
        return;
    }

    // Stop tracking
    CreatureRepository.stop(id);

    const embed = createSuccessEmbed(
        'Tracking Stopped',
        `Stopped tracking **${creature.nickname || creature.creature_type}** (ID: ${id})`
    );

    await interaction.reply({ embeds: [embed] });
}
