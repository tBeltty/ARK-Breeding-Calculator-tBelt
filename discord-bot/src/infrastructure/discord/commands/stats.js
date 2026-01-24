/**
 * /stats Command
 * 
 * Get detailed statistics for a specific creature.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createErrorEmbed } from '../../../shared/embeds.js';
import creatures from '../../../data/creatures.json' assert { type: 'json' };

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Get detailed info about a tracked creature')
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
    const remainingTime = formatDuration(remainingMs);
    const elapsedTime = formatDuration(elapsed);

    const embed = new EmbedBuilder()
        .setColor(percentage >= 100 ? 0x22C55E : 0x6366F1)
        .setTitle(`📊 ${creature.nickname || creature.creature_type}`)
        .setDescription(`**Type:** ${creature.creature_type}\n**Status:** ${creature.status}`)
        .addFields(
            { name: 'Maturation', value: `${progressBar} **${percentage.toFixed(1)}%**`, inline: false },
            { name: '⏱️ Time Elapsed', value: elapsedTime, inline: true },
            { name: '⏳ Time Remaining', value: remainingTime, inline: true },
            { name: '📅 Mature At', value: `<t:${Math.floor(matureTime / 1000)}:F>`, inline: false },
        )
        .setFooter({ text: `ID: ${id} | Tracked by` })
        .setTimestamp();

    // Add creature-specific data
    if (creatureData.type) {
        embed.addFields(
            { name: '🍖 Diet', value: creatureData.type, inline: true },
            { name: '🥚 Birth Type', value: creatureData.birthtype || 'Unknown', inline: true },
            { name: '⚖️ Base Weight', value: `${creatureData.weight || '?'}`, inline: true },
        );
    }

    await interaction.reply({ embeds: [embed] });
}

function createProgressBar(percentage, length = 12) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatDuration(ms) {
    if (ms <= 0) return '✅ Complete!';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
