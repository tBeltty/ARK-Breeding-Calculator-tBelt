/**
 * /help Command
 * 
 * Shows available commands and basic usage information.
 */

import { SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../../shared/embeds.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows available commands and usage information');

export async function execute(interaction) {
    const embed = createInfoEmbed(
        'Arktic Assistant Commands',
        'Track your ARK baby creatures and get notifications!'
    );

    embed.addFields(
        {
            name: '🦖 Tracking', value:
                '`/track <creature>` - Start tracking a baby\n' +
                '`/status` - View all tracked creatures\n' +
                '`/stats <id>` - Detailed creature info\n' +
                '`/stop <id>` - Stop tracking a creature\n' +
                '`/stopall` - Stop all tracking',
            inline: false
        },
        {
            name: '🧮 Calculators', value:
                '`/trough` - Calculate trough requirements\n' +
                '`/buffer` - Time until next feed needed\n' +
                '`/mature <creature>` - Full maturation time',
            inline: false
        },
        {
            name: '⚙️ Settings', value:
                '`/settings view` - View current settings\n' +
                '`/settings game` - Set ASE or ASA\n' +
                '`/settings rates` - Set server rates\n' +
                '`/settings notify` - Configure notifications',
            inline: false
        },
        {
            name: '📊 Info', value:
                '`/info` - Bot statistics\n' +
                '`/invite` - Get bot invite link\n' +
                '`/support` - Support server',
            inline: false
        }
    );

    embed.setFooter({ text: 'Made with ❤️ by tBelt | ark.tbelt.online' });

    await interaction.reply({ embeds: [embed] });
}
