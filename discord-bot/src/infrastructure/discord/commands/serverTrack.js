import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { TrackingRepository } from '../../database/repositories/TrackingRepository.js';
import { serverService } from '../../../application/ServerService.js';
import { EmbedBuilder } from '../EmbedBuilder.js';

export const data = new SlashCommandBuilder()
    .setName('server-track')
    .setDescription('Manage official/unofficial server status tracking')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('add-official')
            .setDescription('Track an official ARK server')
            .addStringOption(opt => opt.setName('query').setDescription('Server ID or Name (e.g., 5966)').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('add-unofficial')
            .setDescription('Track an unofficial server by IP:Port')
            .addStringOption(opt => opt.setName('address').setDescription('IP:Port (e.g., 123.123.123.123:27015)').setRequired(true))
            .addStringOption(opt => opt.setName('name').setDescription('A friendly name for this server').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setDescription('List all tracked servers in this guild')
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setDescription('Stop tracking a server')
            .addStringOption(opt => opt.setName('id').setDescription('The Server ID or Address to remove').setRequired(true))
    );

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        if (subcommand === 'add-official') {
            const query = interaction.options.getString('query');
            const server = serverService.findServer(query);

            if (!server) {
                return interaction.reply({
                    embeds: [EmbedBuilder.createInfo('❌ Server Not Found', `Could not find an official server matching "${query}". Try using the numeric ID.`)],
                    ephemeral: true
                });
            }

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

    } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'An error occurred while managing server tracking.', ephemeral: true });
    }
}
