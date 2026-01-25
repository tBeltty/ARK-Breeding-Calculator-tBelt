import { GuildRepository } from '../../database/repositories/GuildRepository.js';

/**
 * Check if the interaction user has permission to use the command based on guild settings.
 * Support new JSON schema: { "commandName": { "roles": [], "channels": [] } }
 * @param {import('discord.js').Interaction} interaction
 * @param {string} commandName - The specific command ID/Name to check (e.g., 'track', 'server-track')
 * @returns {boolean} true if allowed, false otherwise
 */
export function checkCommandPermission(interaction, commandName) {
    if (!interaction.guildId) return true; // DMs?

    // Admins always allowed (ManageGuild)
    if (interaction.member.permissions.has('ManageGuild')) return true;

    const guild = GuildRepository.findOrCreate(interaction.guildId);
    if (!guild.command_restrictions) return true;

    try {
        const restrictions = JSON.parse(guild.command_restrictions);

        // Handle potential legacy array format (though we are migrating away, safety first)
        if (Array.isArray(restrictions)) {
            // Legacy was global 'track' only
            if (commandName === 'track' && restrictions.length > 0) {
                return interaction.member.roles.cache.some(r => restrictions.includes(r.id));
            }
            return true;
        }

        const rules = restrictions[commandName];
        if (!rules) return true; // No rules for this command -> Allowed

        // 1. Check Channel Restrictions
        if (rules.channels && rules.channels.length > 0) {
            if (!rules.channels.includes(interaction.channelId)) {
                return false;
            }
        }

        // 2. Check Role Restrictions
        if (rules.roles && rules.roles.length > 0) {
            const hasRole = interaction.member.roles.cache.some(r => rules.roles.includes(r.id));
            if (!hasRole) return false;
        }

        return true;
    } catch (e) {
        console.error('Error checking permissions:', e);
        return true; // Fail safe? Or Fail closed? Defaulting to true to avoid blocking on bad JSON.
    }
}
