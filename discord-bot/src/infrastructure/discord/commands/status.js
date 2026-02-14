/**
 * /status Command
 * 
 * View all currently tracked creatures in the guild.
 */

import { SlashCommandBuilder } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createCreatureListEmbed, createInfoEmbed } from '../../../shared/embeds.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setNameLocalizations({ 'es-ES': 'en-curso', 'es-419': 'en-curso' })
    .setDescription('View all tracked creatures in this server')
    .setDescriptionLocalizations({ 'es-ES': 'Criaturas en crecimiento activo', 'es-419': 'Criaturas en crecimiento activo' });

export async function execute(interaction) {
    const locale = getLocale(interaction.guildId);
    const creatures = CreatureRepository.findActiveByGuild(interaction.guildId);

    if (creatures.length === 0) {
        const embed = createInfoEmbed(
            t(locale, 'status.empty_title'),
            t(locale, 'status.empty_desc')
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
            name: t(locale, 'status.ready'),
            value: t(locale, 'status.ready_desc', { count: matureCount }),
            inline: false,
        });
    }

    await interaction.reply({ embeds: [embed] });
}
