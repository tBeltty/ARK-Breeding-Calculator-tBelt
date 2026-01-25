/**
 * Discord Embed Builders
 * 
 * Standardized embeds following Atmos UI color scheme.
 * All embeds use consistent styling and branding.
 */

import { EmbedBuilder } from 'discord.js';

// Atmos UI Colors (from tokens.css)
const COLORS = {
    primary: 0x6366F1,      // Indigo-500 (Cosmic Night primary)
    success: 0x22C55E,       // Green-500
    warning: 0xF59E0B,       // Amber-500
    error: 0xEF4444,         // Red-500
    info: 0x3B82F6,          // Blue-500
    surface: 0x1E293B,       // Slate-800
};

/**
 * Create a success embed
 */
export function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.success)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create an error embed
 */
export function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.error)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create a warning embed
 */
export function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create an info embed
 */
export function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Create a creature tracking embed
 */
// Creature name to filename mapping (synced with frontend)
const ICON_NAME_MAPPINGS = {
    'Araneo': 'Spider',
    'Castoroides': 'Giant_Beaver',
    'Compsognathus': 'Compy',
    'Dilophosaurus': 'Dilophosaur',
    'Direbear': 'Dire_Bear',
    'Gasbag': 'Gasbags',
    'Onychonycteris': 'Onyc',
    'Pachycephalosaurus': 'Pachy',
    'Parasaurolophus': 'Parasaur',
    'Plesiosaurus': 'Plesiosaur',
    'Pulmonoscorpius': 'Scorpion',
    'Quetzalcoatlus': 'Quetzal',
    'Sarcosuchus': 'Sarco',
    'Spinosaurus': 'Spino',
    'Therizinosaurus': 'Therizinosaur',
    'Triceratops': 'Trike',
    'Woolly Rhino': 'Woolly_Rhinoceros',
    'Ferox (Large)': 'Ferox',
};

function getCreatureIconUrl(creatureName) {
    const iconName = ICON_NAME_MAPPINGS[creatureName] || creatureName.replace(/ /g, '_');
    return `https://ark.tbelt.online/creatures/${iconName}.png`;
}

/**
 * Create a creature tracking embed
 */
export function createCreatureEmbed(creature, progress) {
    const progressBar = createProgressBar(progress.percentage);
    const timeRemaining = formatDuration(progress.remainingMs);
    const iconUrl = getCreatureIconUrl(creature.creature_type);

    return new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(`🦖 ${creature.nickname || creature.creature_type}`)
        .setDescription(`**Type:** ${creature.creature_type}`)
        .setThumbnail(iconUrl)
        .addFields(
            { name: 'Maturation', value: `${progressBar} ${progress.percentage.toFixed(1)}%`, inline: false },
            { name: 'Time Remaining', value: timeRemaining, inline: true },
            { name: 'Current Buffer', value: `${progress.bufferMinutes} min`, inline: true },
        )
        .setFooter({ text: 'Arktic Assistant', iconURL: iconUrl })
        .setTimestamp();
}

/**
 * Create a list embed for multiple creatures
 */
export function createCreatureListEmbed(creatures, guildName) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(`🦕 Active Creatures`)
        .setDescription(`Tracking ${creatures.length} creature(s)`)
        .setFooter({ text: 'Arktic Assistant' })
        .setTimestamp();

    if (creatures.length === 0) {
        embed.setDescription('No creatures being tracked. Use `/track` to start!');
        return embed;
    }

    const fields = creatures.slice(0, 10).map((c, i) => ({
        name: `${i + 1}. ${c.nickname || c.creature_type}`,
        value: `ID: \`${c.id}\` | Status: ${c.status}`,
        inline: true,
    }));

    embed.addFields(fields);

    if (creatures.length > 10) {
        embed.addFields({ name: '...', value: `And ${creatures.length - 10} more`, inline: false });
    }

    return embed;
}

/**
 * Create a visual progress bar
 */
function createProgressBar(percentage, length = 10) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms) {
    if (ms <= 0) return 'Complete!';

    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
}
