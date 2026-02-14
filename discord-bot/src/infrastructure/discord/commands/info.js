/**
 * /info Command
 * 
 * Shows bot statistics and information.
 */

import { SlashCommandBuilder, version as djsVersion } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { version } from '../../../shared/version.js';

export const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Shows bot statistics and information');

export async function execute(interaction) {
    const client = interaction.client;

    // Calculate uptime
    const uptime = formatUptime(client.uptime);

    // Get stats
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    const embed = new EmbedBuilder()
        .setColor(0x6366F1) // Atmos primary
        .setTitle('🦖 ARK Breeding Assistant')
        .setDescription('Your Discord companion for ARK breeding!')
        .addFields(
            {
                name: '📊 Statistics', value:
                    `**Servers:** ${guildCount.toLocaleString()}\n` +
                    `**Users:** ${userCount.toLocaleString()}\n` +
                    `**Uptime:** ${uptime}`,
                inline: true
            },
            {
                name: '🔧 Technical', value:
                    `**Version:** ${version}\n` +
                    `**Discord.js:** v${djsVersion}\n` +
                    `**Node.js:** ${process.version}`,
                inline: true
            },
            {
                name: '🔗 Links', value:
                    `[Website](https://ark.tbelt.online)\n` +
                    `[Dashboard](https://ark.tbelt.online/dashboard)\n` +
                    `[Support Server](https://discord.gg/ark-breeding)`,
                inline: true
            }
        )
        .setFooter({ text: 'Made with ❤️ by tBelt' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
