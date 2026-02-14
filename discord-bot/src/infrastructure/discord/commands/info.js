/**
 * /info Command
 * 
 * Shows bot version and links.
 */

import { SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { version } from '../../../shared/version.js';

export const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Shows bot version and links');

export async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle('🦖 ARK Breeding Assistant')
        .setDescription(`**v${version}**\nYour Discord companion for ARK breeding!`)
        .addFields(
            {
                name: '🔗 Links', value:
                    `[Website](https://ark.tbelt.online)\n` +
                    `[Dashboard](https://ark.tbelt.online/dashboard)`,
                inline: false
            }
        )
        .setFooter({ text: 'Made with ❤️ by tBelt' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

