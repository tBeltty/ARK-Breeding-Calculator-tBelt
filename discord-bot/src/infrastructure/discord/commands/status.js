/**
 * /status Command
 * 
 * View all currently tracked creatures in the guild.
 */

import { SlashCommandBuilder } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createCreatureListEmbed, createInfoEmbed } from '../../../shared/embeds.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('View all tracked creatures in this server');

export async function execute(interaction) {
    const creatures = CreatureRepository.findActiveByGuild(interaction.guildId);

    if (creatures.length === 0) {
        const embed = createInfoEmbed(
            'No Active Tracking',
            'No creatures are being tracked.\n\nUse `/track <creature>` to start tracking a baby!'
        );
        await interaction.reply({ embeds: [embed] });
        return;
    }

    // Calculate progress for each creature
    const now = Date.now();
    const creaturesWithProgress = creatures.map(c => {
        const startTime = new Date(c.start_time).getTime();
        const matureTime = new Date(c.mature_time).getTime();
        const totalDuration = matureTime - startTime;
        const elapsed = now - startTime;
        const percentage = Math.min(100, (elapsed / totalDuration) * 100);
        const remainingMs = Math.max(0, matureTime - now);

        return {
            ...c,
            percentage: percentage.toFixed(1),
            remainingMs,
            mature: remainingMs <= 0,
        };
    });

    const embed = createCreatureListEmbed(creaturesWithProgress, interaction.guild.name);

    // Add summary
    const matureCount = creaturesWithProgress.filter(c => c.mature).length;
    if (matureCount > 0) {
        embed.addFields({
            name: '🎉 Ready!',
            value: `${matureCount} creature(s) are fully mature!`,
            inline: false,
        });
    }

    await interaction.reply({ embeds: [embed] });
}
