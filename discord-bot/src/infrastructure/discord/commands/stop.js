/**
 * /stop Command
 * 
 * Stop tracking a specific creature by ID.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createSuccessEmbed, createErrorEmbed } from '../../../shared/embeds.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop tracking a creature')
    .addIntegerOption(option =>
        option
            .setName('id')
            .setDescription('The creature ID (search by name)')
            .setRequired(true)
            .setAutocomplete(true)
    );

export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const guildId = interaction.guildId;
    const userId = interaction.user.id;
    const member = interaction.member;

    let creatures = [];
    const isAdmin = member.permissions.has(PermissionFlagsBits.ManageGuild);

    // Admins see all, users see theirs
    if (isAdmin) {
        creatures = CreatureRepository.findActiveByGuild(guildId);
    } else {
        creatures = CreatureRepository.findActiveByUser(guildId, userId);
    }

    const filtered = creatures
        .filter(c => {
            const label = `${c.nickname || c.creature_type} (ID: ${c.id})`;
            return label.toLowerCase().includes(focusedValue.toLowerCase());
        })
        .slice(0, 25) // Discord limit
        .map(c => ({
            name: `${c.nickname || c.creature_type} (${c.creature_type}) [ID: ${c.id}]`,
            value: c.id
        }));

    await interaction.respond(filtered);
}

export async function execute(interaction) {
    const id = interaction.options.getInteger('id');
    const member = interaction.member;

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

    // Verify Permission (Owner or Admin)
    const isAdmin = member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!isAdmin && creature.user_id !== interaction.user.id) {
        await interaction.reply({
            embeds: [createErrorEmbed('Permission Denied', 'You can only stop your own trackers.')],
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
