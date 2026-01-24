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
 * Load all commands into the client
 */
export async function loadCommands(client) {
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
            logger.debug(`Loaded command: /${command.data.name}`);
        } else {
            logger.warn(`Command ${file} is missing 'data' or 'execute' export`);
        }
    }
}

/**
 * Register loaded commands with Discord API (Global + Guild-specific)
 */
export async function registerCommands(client) {
    const commands = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());

    if (commands.length === 0) return;

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        logger.info(`Registering ${commands.length} slash commands...`);

        // 1. Global registration (can take up to 1 hour to propagate)
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );
        logger.success(`Registered ${commands.length} commands globally`);

        // 2. Guild-specific registration (instantly available)
        if (client.guilds.cache.size > 0) {
            for (const [guildId, guild] of client.guilds.cache) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                    { body: commands }
                );
                logger.debug(`Registered commands for guild: ${guild.name} (${guildId})`);
            }
            logger.success(`Registered commands for ${client.guilds.cache.size} guilds instantly`);
        } else {
            logger.warn('No guilds found in cache for instant registration');
        }
    } catch (error) {
        logger.error('Failed to register commands:', error);
    }
}

