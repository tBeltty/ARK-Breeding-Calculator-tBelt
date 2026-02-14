/**
 * /stop Command
 * 
 * Stop tracking a specific creature by ID.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createSuccessEmbed, createErrorEmbed } from '../../../shared/embeds.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setNameLocalizations({ 'es-ES': 'detener', 'es-419': 'detener' })
    .setDescription('Stop tracking a creature')
    .setDescriptionLocalizations({ 'es-ES': 'Deja de seguir una criatura', 'es-419': 'Deja de seguir una criatura' })
    .addIntegerOption(option =>
        option
            .setName('id')
            .setDescription('The creature ID (search by name)')
            .setDescriptionLocalizations({ 'es-ES': 'ID de la criatura (busca por nombre)', 'es-419': 'ID de la criatura (busca por nombre)' })
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
    const locale = getLocale(interaction.guildId);

    // Find the creature
    const creature = CreatureRepository.findById(id);

    if (!creature) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'stop.not_found'), t(locale, 'stop.not_found_desc', { id }))],
            ephemeral: true,
        });
        return;
    }

    // Verify it belongs to this guild
    if (creature.guild_id !== interaction.guildId) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'stop.access_denied'), t(locale, 'stop.access_denied_desc'))],
            ephemeral: true,
        });
        return;
    }

    // Verify Permission (Owner or Admin)
    const isAdmin = member.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!isAdmin && creature.user_id !== interaction.user.id) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'stop.permission_denied'), t(locale, 'stop.permission_denied_desc'))],
            ephemeral: true,
        });
        return;
    }

    // Stop tracking
    CreatureRepository.stop(id);

    const embed = createSuccessEmbed(
        t(locale, 'stop.success_title'),
        t(locale, 'stop.success_desc', { name: creature.nickname || creature.creature_type, id })
    );

    await interaction.reply({ embeds: [embed] });
}
