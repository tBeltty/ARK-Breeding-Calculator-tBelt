/**
 * Event Loader
 * 
 * Dynamically loads all Discord event handlers.
 */

import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '../../shared/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventsPath = path.join(__dirname, 'events');

/**
 * Load all event handlers and attach them to the client
 */
export async function loadEvents(client) {
    const fs = await import('fs');
    if (!fs.existsSync(eventsPath)) {
        logger.warn('Events directory not found, skipping event loading');
        return;
    }

    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = await import(`file://${filePath}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }

        logger.debug(`Loaded event: ${event.name}`);
    }
}
