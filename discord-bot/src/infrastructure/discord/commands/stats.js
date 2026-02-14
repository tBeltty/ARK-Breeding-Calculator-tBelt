/**
 * /stats Command
 * 
 * Get detailed statistics for a specific creature.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createErrorEmbed } from '../../../shared/embeds.js';
import { creatures } from '../../../shared/dataLoader.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setNameLocalizations({ 'es-ES': 'info-criatura', 'es-419': 'info-criatura' })
    .setDescription('Get detailed info about a tracked creature')
    .setDescriptionLocalizations({ 'es-ES': 'Detalles de una criatura en seguimiento', 'es-419': 'Detalles de una criatura en seguimiento' })
    .addIntegerOption(option =>
        option
            .setName('id')
            .setDescription('The creature ID (from /status)')
            .setDescriptionLocalizations({ 'es-ES': 'ID de la criatura (de /en-curso)', 'es-419': 'ID de la criatura (de /en-curso)' })
            .setRequired(true)
    );

export async function execute(interaction) {
    const id = interaction.options.getInteger('id');
    const locale = getLocale(interaction.guildId);

    // Find the creature
    const creature = CreatureRepository.findById(id);

    if (!creature) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'stats.not_found'), t(locale, 'stats.not_found_desc', { id }))],
            ephemeral: true,
        });
        return;
    }

    // Verify it belongs to this guild
    if (creature.guild_id !== interaction.guildId) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'stats.access_denied'), t(locale, 'stats.access_denied_desc'))],
            ephemeral: true,
        });
        return;
    }

    // Get creature data
    const creatureData = creatures[creature.creature_type] || {};

    // Calculate progress
    const now = Date.now();
    const startTime = new Date(creature.start_time).getTime();
    const matureTime = new Date(creature.mature_time).getTime();
    const totalDuration = matureTime - startTime;
    const elapsed = now - startTime;
    const percentage = Math.min(100, (elapsed / totalDuration) * 100);
    const remainingMs = Math.max(0, matureTime - now);

    // Build progress bar
    const progressBar = createProgressBar(percentage);

    // Format times
    const remainingTime = formatDuration(remainingMs, locale);
    const elapsedTime = formatDuration(elapsed, locale);

    const embed = new EmbedBuilder()
        .setColor(percentage >= 100 ? 0x22C55E : 0x6366F1)
        .setTitle(`📊 ${creature.nickname || creature.creature_type}`)
        .setDescription(`**Type:** ${creature.creature_type}\n**Status:** ${creature.status}`)
        .addFields(
            { name: t(locale, 'stats.maturation'), value: `${progressBar} **${percentage.toFixed(1)}%**`, inline: false },
            { name: t(locale, 'stats.time_elapsed'), value: elapsedTime, inline: true },
            { name: t(locale, 'stats.time_remaining'), value: remainingTime, inline: true },
            { name: t(locale, 'stats.mature_at'), value: `<t:${Math.floor(matureTime / 1000)}:F>`, inline: false },
        )
        .setFooter({ text: `ID: ${id} | Tracked by` })
        .setTimestamp();

    // Add creature-specific data
    if (creatureData.type) {
        embed.addFields(
            { name: t(locale, 'stats.diet'), value: creatureData.type, inline: true },
            { name: t(locale, 'stats.birth_type'), value: creatureData.birthtype || t(locale, 'stats.unknown'), inline: true },
            { name: t(locale, 'stats.base_weight'), value: `${creatureData.weight || '?'}`, inline: true },
        );
    }

    await interaction.reply({ embeds: [embed] });
}

function createProgressBar(percentage, length = 12) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatDuration(ms, locale) {
    if (ms <= 0) return locale === 'es' ? '✅ ¡Completo!' : '✅ Complete!';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
