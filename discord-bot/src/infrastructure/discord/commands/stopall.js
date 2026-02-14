/**
 * /stopall Command
 * 
 * Stop tracking all creatures in the server.
 * Requires ManageGuild permission.
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createSuccessEmbed, createInfoEmbed } from '../../../shared/embeds.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('stopall')
    .setNameLocalizations({ 'es-ES': 'detener-todo', 'es-419': 'detener-todo' })
    .setDescription('Stop tracking all creatures in this server')
    .setDescriptionLocalizations({ 'es-ES': 'Detiene el seguimiento de todas las criaturas', 'es-419': 'Detiene el seguimiento de todas las criaturas' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const locale = getLocale(interaction.guildId);
    const creatures = CreatureRepository.findActiveByGuild(interaction.guildId);

    if (creatures.length === 0) {
        await interaction.reply({
            embeds: [createInfoEmbed(t(locale, 'stopall.nothing'), t(locale, 'stopall.nothing_desc'))],
        });
        return;
    }

    CreatureRepository.stopAllByGuild(interaction.guildId);

    await interaction.reply({
        embeds: [createSuccessEmbed(t(locale, 'stopall.success_title'), t(locale, 'stopall.success_desc', { count: creatures.length }))],
    });
}
