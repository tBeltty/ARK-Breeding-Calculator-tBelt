import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { TrackingRepository } from '../../database/repositories/TrackingRepository.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { serverService } from '../../../application/ServerService.js';
import { EmbedBuilder } from '../EmbedBuilder.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('server-track')
    .setNameLocalizations({ 'es-ES': 'servidor', 'es-419': 'servidor' })
    .setDescription('Manage server status tracking')
    .setDescriptionLocalizations({ 'es-ES': 'Administra seguimiento de servidores', 'es-419': 'Administra seguimiento de servidores' })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('add-official')
            .setNameLocalizations({ 'es-ES': 'añadir-oficial', 'es-419': 'añadir-oficial' })
            .setDescription('Add an official ARK server to track')
            .setDescriptionLocalizations({ 'es-ES': 'Añade un servidor oficial a la lista', 'es-419': 'Añade un servidor oficial a la lista' })
            .addStringOption(opt => opt
                .setName('query')
                .setNameLocalizations({ 'es-ES': 'buscar', 'es-419': 'buscar' })
                .setDescription('Server ID or Name (e.g., 5966)')
                .setDescriptionLocalizations({ 'es-ES': 'ID o nombre del servidor (ej. 5966)', 'es-419': 'ID o nombre del servidor (ej. 5966)' })
                .setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('add-unofficial')
            .setNameLocalizations({ 'es-ES': 'añadir-no-oficial', 'es-419': 'añadir-no-oficial' })
            .setDescription('Add an unofficial server by IP:Port')
            .setDescriptionLocalizations({ 'es-ES': 'Añade un servidor no oficial por IP:Puerto', 'es-419': 'Añade un servidor no oficial por IP:Puerto' })
            .addStringOption(opt => opt
                .setName('address')
                .setNameLocalizations({ 'es-ES': 'ip', 'es-419': 'ip' })
                .setDescription('IP:Port (e.g., 123.123.123.123:27015)')
                .setDescriptionLocalizations({ 'es-ES': 'IP:Puerto (ej. 123.123.123.123:27015)', 'es-419': 'IP:Puerto (ej. 123.123.123.123:27015)' })
                .setRequired(true))
            .addStringOption(opt => opt
                .setName('name')
                .setNameLocalizations({ 'es-ES': 'nombre', 'es-419': 'nombre' })
                .setDescription('A friendly name for this server')
                .setDescriptionLocalizations({ 'es-ES': 'Nombre para identificar el servidor', 'es-419': 'Nombre para identificar el servidor' })
                .setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setNameLocalizations({ 'es-ES': 'lista', 'es-419': 'lista' })
            .setDescription('List all tracked servers')
            .setDescriptionLocalizations({ 'es-ES': 'Muestra los servidores que sigues', 'es-419': 'Muestra los servidores que sigues' })
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setNameLocalizations({ 'es-ES': 'quitar', 'es-419': 'quitar' })
            .setDescription('Stop tracking a server')
            .setDescriptionLocalizations({ 'es-ES': 'Deja de seguir un servidor', 'es-419': 'Deja de seguir un servidor' })
            .addStringOption(opt => opt
                .setName('id')
                .setDescription('The Server ID or Address to remove')
                .setDescriptionLocalizations({ 'es-ES': 'ID o dirección del servidor', 'es-419': 'ID o dirección del servidor' })
                .setRequired(true)
                .setAutocomplete(true))
    )
    .addSubcommand(sub =>
        sub.setName('channel')
            .setNameLocalizations({ 'es-ES': 'canal', 'es-419': 'canal' })
            .setDescription('Set the notification channel for alerts')
            .setDescriptionLocalizations({ 'es-ES': 'Elige el canal para alertas', 'es-419': 'Elige el canal para alertas' })
            .addChannelOption(option =>
                option.setName('channel')
                    .setNameLocalizations({ 'es-ES': 'canal', 'es-419': 'canal' })
                    .setDescription('The channel to send notifications to')
                    .setDescriptionLocalizations({ 'es-ES': 'Canal donde enviar alertas', 'es-419': 'Canal donde enviar alertas' })
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('Specific server ID (optional, leave empty for ALL)')
                    .setDescriptionLocalizations({ 'es-ES': 'ID específico (opcional, vacío para TODOS)', 'es-419': 'ID específico (opcional, vacío para TODOS)' })
                    .setAutocomplete(true)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const locale = getLocale(interaction.guildId);

    try {
        const { checkCommandPermission } = await import('../security/permissionCheck.js');
        if (!checkCommandPermission(interaction, 'server-track')) {
            return interaction.reply({ content: t(locale, 'common.no_permission'), ephemeral: true });
        }

        if (subcommand === 'add-official') {
            const query = interaction.options.getString('query');
            const results = await serverService.findServer(query, true);

            if (results.error === 'RATE_LIMIT') {
                return interaction.reply({
                    embeds: [EmbedBuilder.createInfo(t(locale, 'server_track.rate_limit_title'), t(locale, 'server_track.rate_limit_desc', { seconds: results.retryAfter }))],
                    ephemeral: true
                });
            }

            if (!results || results.length === 0) {
                return interaction.reply({
                    embeds: [EmbedBuilder.createInfo(t(locale, 'server_track.not_found_title'), t(locale, 'server_track.not_found_desc', { query }))],
                    ephemeral: true
                });
            }

            const server = results[0];

            if (TrackingRepository.isTracked(interaction.guildId, String(server.id))) {
                return interaction.reply({ content: t(locale, 'server_track.already_tracked'), ephemeral: true });
            }

            TrackingRepository.add({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                serverId: String(server.id),
                serverName: server.name,
                type: 'official'
            });

            const status = serverService.getStatus(String(server.id)) || server;
            return interaction.reply({
                embeds: [
                    EmbedBuilder.createInfo(t(locale, 'server_track.tracking_started'), t(locale, 'server_track.tracking_started_desc', { name: server.name })),
                    EmbedBuilder.createServerStatus(status, server.name)
                ]
            });
        }

        if (subcommand === 'add-unofficial') {
            const address = interaction.options.getString('address');
            const name = interaction.options.getString('name');

            if (TrackingRepository.isTracked(interaction.guildId, address)) {
                return interaction.reply({ content: t(locale, 'server_track.already_tracked_address'), ephemeral: true });
            }

            TrackingRepository.add({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                serverId: address,
                serverName: name,
                type: 'unofficial'
            });

            return interaction.reply({
                embeds: [EmbedBuilder.createInfo(t(locale, 'server_track.unofficial_started'), t(locale, 'server_track.unofficial_started_desc', { name, address }))]
            });
        }

        if (subcommand === 'list') {
            const servers = TrackingRepository.listByGuild(interaction.guildId);
            if (servers.length === 0) {
                return interaction.reply({ content: t(locale, 'server_track.list_empty'), ephemeral: true });
            }

            const list = servers.map(s => `• **${s.server_name}** (\`${s.server_id}\`) - ${s.type}`).join('\n');
            return interaction.reply({
                embeds: [EmbedBuilder.createInfo(t(locale, 'server_track.list_title'), list)]
            });
        }

        if (subcommand === 'remove') {
            const id = interaction.options.getString('id');
            TrackingRepository.remove(interaction.guildId, id);
            return interaction.reply({
                embeds: [EmbedBuilder.createInfo(t(locale, 'server_track.removed_title'), t(locale, 'server_track.removed_desc', { id }))]
            });
        }

        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');
            const serverId = interaction.options.getString('id');

            if (!channel.isTextBased() || !channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'ViewChannel'])) {
                return interaction.reply({ content: t(locale, 'server_track.channel_no_perms', { channel }), ephemeral: true });
            }

            if (serverId) {
                const result = TrackingRepository.updateChannel(interaction.guildId, serverId, channel.id);
                if (result.changes > 0) {
                    await interaction.reply(t(locale, 'server_track.channel_updated', { id: serverId, channel }));
                } else {
                    await interaction.reply({ content: t(locale, 'server_track.channel_not_found', { id: serverId }), ephemeral: true });
                }
            } else {
                GuildRepository.updateSettings(interaction.guildId, { notify_channel_id: channel.id });
                const result = TrackingRepository.updateAllChannels(interaction.guildId, channel.id);
                await interaction.reply(t(locale, 'server_track.channel_all_updated', { channel, count: result.changes }));
            }
        }

    } catch (error) {
        console.error(error);
        return interaction.reply({ content: t(locale, 'server_track.error'), ephemeral: true });
    }
}

/**
 * Autocomplete handler for server-track remove
 */
export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'remove' || subcommand === 'channel') {
        const tracked = TrackingRepository.listByGuild(interaction.guildId);

        const filtered = tracked.filter(s =>
            (s.server_name && s.server_name.toLowerCase().includes(focusedValue)) ||
            (s.server_id && s.server_id.toLowerCase().includes(focusedValue))
        );

        await interaction.respond(
            filtered.slice(0, 25).map(s => ({
                name: `${s.server_name || 'Unknown'} (${s.server_id})`,
                value: s.server_id,
            }))
        );
    }
}
