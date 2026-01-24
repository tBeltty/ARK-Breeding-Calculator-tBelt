/**
 * /stopall Command
 * 
 * Stop tracking all creatures in the server.
 * Requires ManageGuild permission.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createSuccessEmbed, createInfoEmbed } from '../../../shared/embeds.js';

export const data = new SlashCommandBuilder()
    .setName('stopall')
    .setDescription('Stop tracking all creatures in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const creatures = CreatureRepository.findActiveByGuild(interaction.guildId);

    if (creatures.length === 0) {
        await interaction.reply({
            embeds: [createInfoEmbed('Nothing to Stop', 'There are no creatures being tracked.')],
        });
        return;
    }

    CreatureRepository.stopAllByGuild(interaction.guildId);

    await interaction.reply({
        embeds: [createSuccessEmbed('All Tracking Stopped', `Stopped tracking **${creatures.length}** creature(s).`)],
    });
}
