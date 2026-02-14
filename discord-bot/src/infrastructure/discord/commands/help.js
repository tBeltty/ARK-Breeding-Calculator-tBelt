/**
 * /help Command
 * 
 * Shows available commands and basic usage information.
 */

import { SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../../shared/embeds.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setNameLocalizations({ 'es-ES': 'ayuda', 'es-419': 'ayuda' })
    .setDescription('Shows available commands and usage information')
    .setDescriptionLocalizations({ 'es-ES': 'Muestra los comandos disponibles', 'es-419': 'Muestra los comandos disponibles' });

export async function execute(interaction) {
    const locale = getLocale(interaction.guildId);

    const embed = createInfoEmbed(
        t(locale, 'help.title'),
        t(locale, 'help.desc')
    );

    embed.addFields(
        {
            name: t(locale, 'help.tracking_title'),
            value: t(locale, 'help.tracking_desc'),
            inline: false
        },
        {
            name: t(locale, 'help.calc_title'),
            value: t(locale, 'help.calc_desc'),
            inline: false
        },
        {
            name: t(locale, 'help.settings_title'),
            value: t(locale, 'help.settings_desc'),
            inline: false
        },
        {
            name: t(locale, 'help.server_title'),
            value: t(locale, 'help.server_desc'),
            inline: false
        }
    );

    embed.setFooter({ text: 'Made with ❤️ by tBelt | ark.tbelt.online' });

    await interaction.reply({ embeds: [embed] });
}
