import axios from 'axios';
import { NewsService } from './src/application/NewsService.js';
import { EmbedBuilder } from './src/infrastructure/discord/EmbedBuilder.js';

const RSS_URL = 'https://survivetheark.com/index.php?/rss/3-ark-news.xml/';

class MockChannel {
    constructor() {
        this.sentPayloads = [];
    }
    async send(payload) {
        this.sentPayloads.push(payload);
    }
}

async function diagnostic() {
    console.log('--- Deep News Diagnostic ---');
    try {
        const response = await axios.get(RSS_URL);
        const xml = response.data;
        const items = NewsService.parseRSS(xml);

        console.log(`Found ${items.length} items.`);
        const latest = items[0];
        console.log(`Latest Title: ${latest.title}`);
        console.log(`Extracted Image: ${latest.image || 'NONE'}`);

        const mockChannel = new MockChannel();

        // Mocking the client and channel structure needed by distributeNews
        NewsService.client = {
            channels: {
                fetch: async () => mockChannel
            }
        };

        // We need to mock GuildRepository too since distributeNews uses it
        // Instead of mocking the whole service, let's just test the embed generation logic directly

        const embed = EmbedBuilder.createNewsEmbed(
            latest.title,
            latest.description.substring(0, 400),
            latest.link,
            latest.image,
            latest.pubDate
        );

        const json = embed.toJSON();
        console.log('--- GENERATED EMBED JSON ---');
        console.log(JSON.stringify(json, null, 2));

        if (json.image && json.image.url) {
            console.log('✅ SUCCESS: Image URL is in the correct JSON field.');
        } else {
            console.log('❌ FAILURE: Image URL is missing from JSON payload.');
        }

    } catch (e) {
        console.error('Diagnostic error:', e);
    }
}

diagnostic();
