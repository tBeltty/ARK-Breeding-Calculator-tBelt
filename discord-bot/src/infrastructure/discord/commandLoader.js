/**
 * Command Loader
 * 
 * Dynamically loads all slash commands from the commands directory.
 * Registers them with Discord API on bot startup.
 */

import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '../../shared/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');

/**
 * Load all commands into the client and register with Discord
 */
export async function loadCommands(client) {
    const commands = [];

    // Check if commands directory exists
    const fs = await import('fs');
    if (!fs.existsSync(commandsPath)) {
        logger.warn('Commands directory not found, skipping command loading');
        return;
    }

    // Load command files
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(`file://${filePath}`);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            logger.debug(`Loaded command: /${command.data.name}`);
        } else {
            logger.warn(`Command ${file} is missing 'data' or 'execute' export`);
        }
    }

    // Register commands with Discord API
    if (commands.length > 0) {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);

        try {
            logger.info(`Registering ${commands.length} slash commands...`);

            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );

            logger.success(`Registered ${commands.length} commands globally`);
        } catch (error) {
            logger.error('Failed to register commands:', error);
        }
    }
}
