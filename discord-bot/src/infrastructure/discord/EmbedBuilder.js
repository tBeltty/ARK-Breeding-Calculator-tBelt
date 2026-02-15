import { EmbedBuilder as DiscordEmbedBuilder } from 'discord.js';

/**
 * EmbedBuilder
 * Creates premium, AtmosUI-inspired Discord embeds for Arktic Assistant.
 */
export class EmbedBuilder {
    static COLORS = {
        EMERALD: 0x10b981,
        CRIMSON: 0xef4444,
        SAPPHIRE: 0x3b82f6,
        SLATE: 0x1e293b
    };

    /**
     * Create a server status embed
     * @param {Object} server Server data from statusCache
     * @param {string} name Server name
     */
    static createServerStatus(server, name) {
        const isOnline = server.status === 'online';
        const color = isOnline ? this.COLORS.EMERALD : this.COLORS.CRIMSON;
        const statusEmoji = isOnline ? '🟢' : '🔴';

        const embed = new DiscordEmbedBuilder()
            .setColor(color)
            .setTitle(`${statusEmoji} ${name}`)
            .setTimestamp()
            .setFooter({ text: 'Arktic Assistant • Server Monitor' });

        if (isOnline) {
            embed.addFields(
                { name: '🗺️ Map', value: server.map || 'Unknown', inline: true },
                { name: '👥 Players', value: `${server.players}/${server.maxPlayers}`, inline: true },
                { name: '⚙️ Version', value: server.version || 'ASA', inline: true }
            );

            if (server.uptime) {
                embed.addFields({ name: '⏱️ Uptime', value: `${server.uptime}% (7d)`, inline: true });
            }
        } else {
            embed.setDescription('The server is currently **Offline**. We will notify you as soon as it returns.');
        }

        return embed;
    }

    /**
     * Create a rate update embed
     */
    static createRateUpdate(maturation, lastChangedAt) {
        return new DiscordEmbedBuilder()
            .setColor(this.COLORS.SAPPHIRE)
            .setTitle('🚀 Official Rates Updated')
            .setDescription(`Official server rates have changed to **x${maturation}** maturation speed.`)
            .addFields({ name: '🕒 Effective Since', value: `<t:${Math.floor(lastChangedAt / 1000)}:R>` })
            .setFooter({ text: 'Arktic Assistant • System Sync' })
            .setTimestamp();
    }

    /**
     * Create a news update embed
     */
    static createNewsEmbed(title, description, url, imageUrl, timestamp) {
        const embed = new DiscordEmbedBuilder()
            .setColor(this.COLORS.SAPPHIRE)
            .setTitle(title)
            .setURL(url)
            .setDescription(description)
            .setTimestamp(new Date(timestamp))
            .setFooter({ text: 'survivetheark.com • Arktic News' });

        if (imageUrl) {
            embed.setImage(imageUrl);
        }

        return embed;
    }

    /**
     * Create a simple info/success embed
     */
    static createInfo(title, description, color = this.COLORS.SLATE) {
        return new DiscordEmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    }
}


