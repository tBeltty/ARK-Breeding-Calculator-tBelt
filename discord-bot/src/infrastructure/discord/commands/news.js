import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { NewsRepository } from '../../database/repositories/NewsRepository.js';
import { EmbedBuilder } from '../EmbedBuilder.js';
import { t, getLocale } from '../../../shared/i18n.js';
import { NewsService } from '../../../application/NewsService.js';

export const data = new SlashCommandBuilder()
    .setName('news')
    .setNameLocalizations({ 'es-ES': 'noticias', 'es-419': 'noticias' })
    .setDescription('Configure ARK news notifications')
    .setDescriptionLocalizations({ 'es-ES': 'Configura las noticias de ARK', 'es-419': 'Configura las noticias de ARK' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('setup')
            .setNameLocalizations({ 'es-ES': 'configurar', 'es-419': 'configurar' })
            .setDescription('Set the channel for official news releases')
            .setDescriptionLocalizations({ 'es-ES': 'Configurar canal para noticias oficiales', 'es-419': 'Configurar canal para noticias oficiales' })
            .addChannelOption(opt => opt
                .setName('channel')
                .setNameLocalizations({ 'es-ES': 'canal', 'es-419': 'canal' })
                .setDescription('The channel to post news in')
                .setDescriptionLocalizations({ 'es-ES': 'Canal donde publicar noticias', 'es-419': 'Canal donde publicar noticias' })
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
            .addStringOption(opt => opt
                .setName('send-last_post')
                .setNameLocalizations({ 'es-ES': 'enviar-ultimo', 'es-419': 'enviar-ultimo' })
                .setDescription('Send the latest post immediately?')
                .setDescriptionLocalizations({ 'es-ES': '¿Enviar el último post ahora?', 'es-419': '¿Enviar el último post ahora?' })
                .addChoices(
                    { name: 'Yes', value: 'yes', name_localizations: { 'es-ES': 'Sí', 'es-419': 'Sí' } },
                    { name: 'No', value: 'no', name_localizations: { 'es-ES': 'No', 'es-419': 'No' } }
                )
            )
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setNameLocalizations({ 'es-ES': 'quitar', 'es-419': 'quitar' })
            .setDescription('Stop receiving news updates')
            .setDescriptionLocalizations({ 'es-ES': 'Dejar de recibir noticias', 'es-419': 'Dejar de recibir noticias' })
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const locale = getLocale(interaction.guildId);

    try {
        if (subcommand === 'setup') {
            const channel = interaction.options.getChannel('channel');
            const sendLast = interaction.options.getString('send-last_post') === 'yes';

            // Permission check for the bot in that channel
            if (!channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'ViewChannel', 'EmbedLinks'])) {
                return interaction.reply({ content: t(locale, 'news.no_perms', { channel: channel.toString() }), ephemeral: true });
            }

            NewsRepository.subscribe(interaction.guildId, channel.id);

            // If user wants the last post now
            if (sendLast) {
                const guid = await NewsService.sendLatestNow(interaction.guildId, channel.id);
                if (guid) {
                    NewsRepository.updateLastPost(interaction.guildId, guid);
                }
            }

            return interaction.reply({
                embeds: [EmbedBuilder.createInfo(t(locale, 'news.setup_success_title'), t(locale, 'news.setup_success_desc', { channel: channel.toString() }))],
                ephemeral: true
            });
        }

        if (subcommand === 'remove') {
            NewsRepository.unsubscribe(interaction.guildId);

            return interaction.reply({
                embeds: [EmbedBuilder.createInfo(t(locale, 'news.remove_success_title'), t(locale, 'news.remove_success_desc'))],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: t(locale, 'common.error'), ephemeral: true });
    }
}
