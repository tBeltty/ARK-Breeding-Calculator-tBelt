import axios from 'axios';
import cron from 'node-cron';
import { EmbedBuilder } from 'discord.js';
import { NewsRepository } from '../infrastructure/database/repositories/NewsRepository.js';
import { logger } from '../shared/logger.js';
import { t } from '../shared/i18n.js';
import { GuildRepository } from '../infrastructure/database/repositories/GuildRepository.js';

const RSS_URL = 'https://survivetheark.com/index.php?/rss/3-ark-news.xml/';

/**
 * NewsService
 * Handles RSS polling and news distribution.
 */
export class NewsService {
    static client = null;

    /**
     * Start the news polling service
     */
    static init(client) {
        this.client = client;

        // Poll every 15 minutes
        cron.schedule('*/15 * * * *', () => {
            this.checkNews();
        });

        logger.success('NewsService initialized (Polling every 15m)');
    }

    /**
     * Check RSS feed for new posts
     */
    static async checkNews() {
        try {
            const response = await axios.get(RSS_URL);
            const xml = response.data;

            // Extract items using regex (Simple and dependency-free for this specific feed)
            const items = this.parseRSS(xml);
            if (items.length === 0) return;

            const subscriptions = NewsRepository.listAll();

            for (const sub of subscriptions) {
                // Find potential new posts (more recent than last_post_guid)
                // Since RSS is ordered by date, we just need to find index of last_post_guid
                const lastIndex = items.findIndex(item => item.guid === sub.last_post_guid);

                // If last_post_guid is null, it's a new subscription. 
                // We'll set the current top post as last and don't spam.
                if (!sub.last_post_guid) {
                    NewsRepository.updateLastPost(sub.guild_id, items[0].guid);
                    continue;
                }

                // If not found, either GUID expired/is old or it's a new feed state. 
                // We'll just update to latest to avoid spamming 10+ posts.
                if (lastIndex === -1) {
                    NewsRepository.updateLastPost(sub.guild_id, items[0].guid);
                    continue;
                }

                // New posts are those before the lastIndex in the array
                const newPosts = items.slice(0, lastIndex).reverse(); // Reverse to post in chronological order

                if (newPosts.length > 0) {
                    await this.distributeNews(sub, newPosts);
                    NewsRepository.updateLastPost(sub.guild_id, items[0].guid);
                }
            }
        } catch (error) {
            logger.error(`NewsService Error: ${error.message}`);
        }
    }

    /**
     * Distribute new posts to a specific guild/channel
     */
    static async distributeNews(subscription, posts) {
        const channel = await this.client.channels.fetch(subscription.channel_id).catch(() => null);
        if (!channel) return;

        const guildSettings = GuildRepository.findOrCreate(subscription.guild_id);
        const locale = guildSettings.locale || 'en';

        for (const post of posts) {
            const embed = new EmbedBuilder()
                .setTitle(post.title)
                .setURL(post.link)
                .setDescription(this.truncate(post.description, 400))
                .setColor(0x6366F1)
                .setTimestamp(new Date(post.pubDate))
                .setFooter({ text: 'survivetheark.com' });

            if (post.image) {
                embed.setImage(post.image);
            }

            await channel.send({ embeds: [embed] }).catch(err => {
                logger.error(`Failed to send news to ${subscription.guild_id}: ${err.message}`);
            });
        }
    }

    /**
     * Parse RSS XML to objects
     */
    static parseRSS(xml) {
        const items = [];
        const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

        for (const match of itemMatches) {
            const content = match[1];
            items.push({
                title: this.getTagContent(content, 'title'),
                link: this.getTagContent(content, 'link'),
                guid: this.getTagContent(content, 'guid'),
                description: this.cleanDescription(this.getTagContent(content, 'description')),
                pubDate: this.getTagContent(content, 'pubDate'),
                image: this.extractImage(content)
            });
        }

        return items;
    }

    static getTagContent(xml, tag) {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = xml.match(regex);
        let content = match ? match[1] : '';

        // Handle CDATA
        if (content.includes('<![CDATA[')) {
            content = content.replace('<![CDATA[', '').replace(']]>', '');
        }
        return content.trim();
    }

    static cleanDescription(html) {
        // Basic HTML tag removal and whitespace cleaning
        return html
            .replace(/<[^>]*>?/gm, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    static extractImage(itemContent) {
        // Try to find image in description or media tags
        const imgMatch = itemContent.match(/<img[^>]+src="([^">]+)"/i);
        if (imgMatch) return imgMatch[1];

        const mediaMatch = itemContent.match(/<media:content[^>]+url="([^">]+)"/i);
        if (mediaMatch) return mediaMatch[1];

        return null;
    }

    static truncate(str, len) {
        if (str.length <= len) return str;
        return str.substring(0, len) + '...';
    }
}
