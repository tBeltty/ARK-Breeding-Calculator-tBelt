import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { TrackingRepository } from '../../database/repositories/TrackingRepository.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { serverService } from '../../../application/ServerService.js';
import { EmbedBuilder } from '../EmbedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('server-track')
    .setNameLocalizations({
        'es-ES': 'monitorear-servidor'
    })
    .setDescription('Manage official/unofficial server status tracking')
    .setDescriptionLocalizations({
        'es-ES': 'Gestiona el monitoreo de servidores oficiales y no oficiales'
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('add-official')
            .setNameLocalizations({ 'es-ES': 'agregar-oficial' })
            .setDescription('Track an official ARK server')
            .setDescriptionLocalizations({ 'es-ES': 'Rastrear un servidor oficial de ARK' })
            .addStringOption(opt => opt
                .setName('query')
                .setNameLocalizations({ 'es-ES': 'consulta' })
                .setDescription('Server ID or Name (e.g., 5966)')
                .setDescriptionLocalizations({ 'es-ES': 'ID o Nombre del Servidor (ej. 5966)' })
                .setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('add-unofficial')
            .setNameLocalizations({ 'es-ES': 'agregar-no-oficial' })
            .setDescription('Track an unofficial server by IP:Port')
            .setDescriptionLocalizations({ 'es-ES': 'Rastrear servidor no oficial por IP:Puerto' })
            .addStringOption(opt => opt
                .setName('address')
                .setNameLocalizations({ 'es-ES': 'direccion' })
                .setDescription('IP:Port (e.g., 123.123.123.123:27015)')
                .setDescriptionLocalizations({ 'es-ES': 'IP:Puerto (ej. 123...:27015)' })
                .setRequired(true))
            .addStringOption(opt => opt
                .setName('name')
                .setNameLocalizations({ 'es-ES': 'nombre' })
                .setDescription('A friendly name for this server')
                .setDescriptionLocalizations({ 'es-ES': 'Nombre identificativo para este servidor' })
                .setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setNameLocalizations({ 'es-ES': 'listar' })
            .setDescription('List all tracked servers in this guild')
            .setDescriptionLocalizations({ 'es-ES': 'Listar todos los servidores rastreados' })
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setNameLocalizations({ 'es-ES': 'eliminar' })
            .setDescription('Stop tracking a server')
            .setDescriptionLocalizations({ 'es-ES': 'Dejar de rastrear un servidor' })
            .addStringOption(opt => opt
                .setName('id')
                .setDescription('The Server ID or Address to remove')
                .setDescriptionLocalizations({ 'es-ES': 'El ID o Dirección a eliminar' })
                .setRequired(true)
                .setAutocomplete(true))
    )
    .addSubcommand(sub =>
        sub.setName('channel')
            .setNameLocalizations({ 'es-ES': 'canal' })
            .setDescription('Set the notification channel for tracked servers')
            .setDescriptionLocalizations({ 'es-ES': 'Configurar canal de notificaciones' })
            .addChannelOption(option =>
                option.setName('channel')
                    .setNameLocalizations({ 'es-ES': 'canal' })
                    .setDescription('The channel to send notifications to')
                    .setDescriptionLocalizations({ 'es-ES': 'El canal donde enviar alertas' })
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('Specific server ID (optional, leave empty to set for ALL)')
                    .setDescriptionLocalizations({ 'es-ES': 'ID específico (opcional, vacío para TODOS)' })
                    .setAutocomplete(true)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        const { checkCommandPermission } = await import('../security/permissionCheck.js');
        if (!checkCommandPermission(interaction, 'server-track')) {
            return interaction.reply({ content: '⛔ You do not have permission to use this command here.', ephemeral: true });
        }

        if (subcommand === 'add-official') {
            const query = interaction.options.getString('query');

            // 1. Find the server (Search returns an array or rate limit error)
            // Force onlyOfficial=true for this subcommand
            const results = await serverService.findServer(query, true);

            if (results.error === 'RATE_LIMIT') {
                return interaction.reply({
                    embeds: [EmbedBuilder.createInfo('⏳ Rate Limit', `The search API is temporarily rate limited. Please try again in ${results.retryAfter} seconds.`)],
                    ephemeral: true
                });
            }

            if (!results || results.length === 0) {
                return interaction.reply({
                    embeds: [EmbedBuilder.createInfo('❌ Server Not Found', `Could not find an official server matching "${query}". Try using the numeric ID.`)],
                    ephemeral: true
                });
            }

            // Pick the first result
            const server = results[0];

            if (TrackingRepository.isTracked(interaction.guildId, String(server.id))) {
                return interaction.reply({ content: 'That server is already being tracked here!', ephemeral: true });
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
                    EmbedBuilder.createInfo('✅ Tracking Started', `We are now monitoring **${server.name}** and will alert this channel of status changes.`),
                    EmbedBuilder.createServerStatus(status, server.name)
                ]
            });
        }

        if (subcommand === 'add-unofficial') {
            const address = interaction.options.getString('address');
            const name = interaction.options.getString('name');

            if (TrackingRepository.isTracked(interaction.guildId, address)) {
                return interaction.reply({ content: 'That address is already being tracked!', ephemeral: true });
            }

            TrackingRepository.add({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                serverId: address,
                serverName: name,
                type: 'unofficial'
            });

            return interaction.reply({
                embeds: [EmbedBuilder.createInfo('✅ Unofficial Tracking Started', `Monitoring **${name}** (${address}) via direct UDP. Alerts will be sent to this channel.`)]
            });
        }

        if (subcommand === 'list') {
            const servers = TrackingRepository.listByGuild(interaction.guildId);
            if (servers.length === 0) {
                return interaction.reply({ content: 'No servers are currently being tracked in this guild.', ephemeral: true });
            }

            const list = servers.map(s => `• **${s.server_name}** (\`${s.server_id}\`) - ${s.type}`).join('\n');
            return interaction.reply({
                embeds: [EmbedBuilder.createInfo('🛰️ Tracked Servers', list)]
            });
        }

        if (subcommand === 'remove') {
            const id = interaction.options.getString('id');
            TrackingRepository.remove(interaction.guildId, id);
            return interaction.reply({
                embeds: [EmbedBuilder.createInfo('🗑️ Tracking Removed', `Stopped monitoring server \`${id}\`.`)]
            });
        }

        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel');
            const serverId = interaction.options.getString('id');

            // Validate channel permissions
            if (!channel.isTextBased() || !channel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'ViewChannel'])) {
                return interaction.reply({ content: `❌ I cannot send messages to ${channel}. Please check my permissions.`, ephemeral: true });
            }

            if (serverId) {
                // Update specific
                const result = TrackingRepository.updateChannel(interaction.guildId, serverId, channel.id);
                if (result.changes > 0) {
                    await interaction.reply(`✅ Notification channel for server **${serverId}** updated to ${channel}.`);
                } else {
                    await interaction.reply({ content: `❌ Server **${serverId}** not found in tracking list.`, ephemeral: true });
                }
            } else {
                // Update ALL and Default
                GuildRepository.updateSettings(interaction.guildId, { notify_channel_id: channel.id });
                const result = TrackingRepository.updateAllChannels(interaction.guildId, channel.id);
                await interaction.reply(`✅ Default notification channel updated to ${channel}.\n📝 Moved **${result.changes}** existing tracked servers to this channel.`);
            }
        }

    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'An error occurred while managing server tracking.', ephemeral: true });
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

        // Limit to 25 results (Discord maximum)
        await interaction.respond(
            filtered.slice(0, 25).map(s => ({
                name: `${s.server_name || 'Unknown'} (${s.server_id})`,
                value: s.server_id,
            }))
        );
    }
}
