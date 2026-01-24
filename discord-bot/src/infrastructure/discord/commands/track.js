/**
 * /track Command
 * 
 * Start tracking a baby creature.
 * Calculates maturation time based on creature data and server rates.
 */

import { SlashCommandBuilder } from 'discord.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { createSuccessEmbed, createErrorEmbed, createCreatureEmbed } from '../../../shared/embeds.js';
import { validateCreatureName, validateNickname } from '../../../shared/validation.js';
import creatures from '../../../data/creatures.json' with { type: 'json' };
import {
    calculateMaturationTime,
    calculateBufferTime,
    getCreatureDiet,
    getDefaultFoodForCreature,
    DEFAULT_SETTINGS
} from '../../../domain/breeding.js';

// Get list of creature names for autocomplete
const creatureNames = Object.keys(creatures).sort();

export const data = new SlashCommandBuilder()
    .setName('track')
    .setDescription('Start tracking a baby creature')
    .addStringOption(option =>
        option
            .setName('creature')
            .setDescription('The type of creature (e.g., Rex, Wyvern)')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
            .setName('nickname')
            .setDescription('Optional nickname for this baby')
            .setRequired(false)
    )
    .addNumberOption(option =>
        option
            .setName('progress')
            .setDescription('Current maturation % (default: 0)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(99.9)
    )
    .addNumberOption(option =>
        option
            .setName('weight')
            .setDescription('Creature weight stat (for accurate buffer)')
            .setRequired(false)
            .setMinValue(1)
    )
    .addStringOption(option =>
        option
            .setName('notify_mode')
            .setDescription('How to notify you')
            .setRequired(false)
            .addChoices(
                { name: 'DM', value: 'dm' },
                { name: 'Channel', value: 'channel' }
            )
    )
    .addChannelOption(option =>
        option
            .setName('channel')
            .setDescription('Discord channel for alerts (if mode is channel)')
            .setRequired(false)
    )
    .addStringOption(option =>
        option
            .setName('food')
            .setDescription('Food type for buffer (default: primary for diet)')
            .setRequired(true)
            .setAutocomplete(true)
    );

/**
 * Handle autocomplete for creature names
 */
/**
 * Handle autocomplete for creature names
 */
export async function autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    const focusedValue = focusedOption.value.toLowerCase();

    if (focusedOption.name === 'creature') {
        const filtered = creatureNames
            .filter(name => name.toLowerCase().includes(focusedValue))
            .slice(0, 25);
        await interaction.respond(filtered.map(name => ({ name, value: name })));
    } else if (focusedOption.name === 'food') {
        const selectedCreature = interaction.options.getString('creature');
        let choices;

        if (selectedCreature && creatures[selectedCreature]) {
            choices = getCreatureDiet(selectedCreature);
        } else {
            const foods = (await import('../../../data/foods.json', { with: { type: 'json' } })).default;
            choices = Object.keys(foods).sort();
        }

        const filtered = choices
            .filter(name => name.toLowerCase().includes(focusedValue))
            .slice(0, 25);
        await interaction.respond(filtered.map(name => ({ name, value: name })));
    }
}

/**
 * Execute the /track command
 */
export async function execute(interaction) {
    const creatureInput = interaction.options.getString('creature');
    const nicknameInput = interaction.options.getString('nickname');
    const progress = interaction.options.getNumber('progress') || 0;
    const weight = interaction.options.getNumber('weight');
    const notifyMode = interaction.options.getString('notify_mode');
    const notifyChannel = interaction.options.getChannel('channel');

    // 0. Rate Limit Check
    const { RateLimitService } = await import('../../../application/RateLimitService.js');
    const isAllowed = await RateLimitService.check(`cmd:track:${interaction.user.id}`, 5, 60);
    if (!isAllowed) {
        return interaction.reply({ content: 'Slow down! You can only track 5 creatures per minute.', ephemeral: true });
    }

    // 1. Get guild settings and check RBAC
    const guild = GuildRepository.findOrCreate(interaction.guildId);
    if (guild.command_restrictions) {
        const allowedRoles = JSON.parse(guild.command_restrictions);
        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
            const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
            const isAdmin = interaction.member.permissions.has('ManageGuild');
            if (!hasRole && !isAdmin) {
                return interaction.reply({ content: 'You do not have permission to use this command in this server.', ephemeral: true });
            }
        }
    }

    // Validate creature name
    const creatureValidation = validateCreatureName(creatureInput);
    if (!creatureValidation.valid) {
        await interaction.reply({
            embeds: [createErrorEmbed('Invalid Creature', creatureValidation.error)],
            ephemeral: true,
        });
        return;
    }

    // Find creature in database
    const creatureType = findCreatureType(creatureValidation.value);
    if (!creatureType) {
        await interaction.reply({
            embeds: [createErrorEmbed('Unknown Creature', `"${creatureInput}" is not a recognized creature. Use autocomplete for suggestions.`)],
            ephemeral: true,
        });
        return;
    }

    // Validate nickname
    const nicknameValidation = validateNickname(nicknameInput);
    if (!nicknameValidation.valid) {
        await interaction.reply({
            embeds: [createErrorEmbed('Invalid Nickname', nicknameValidation.error)],
            ephemeral: true,
        });
        return;
    }

    // Check creature limit
    if (!CreatureRepository.canAddCreature(interaction.guildId, guild.premium_tier)) {
        const limits = { free: 2, pro: 50, tribe: 1000 };
        await interaction.reply({
            embeds: [createErrorEmbed('Limit Reached',
                `You've reached the maximum of ${limits[guild.premium_tier] || 2} creatures for your tier.\n` +
                `Use \`/stop\` to remove old creatures or upgrade your plan.`
            )],
            ephemeral: true,
        });
        return;
    }

    // Calculate maturation time
    const creatureData = creatures[creatureType];
    const settings = { ...DEFAULT_SETTINGS, maturationSpeed: guild.server_rates || 1 };
    const totalMaturationSeconds = calculateMaturationTime(creatureData, settings);
    const remainingProgress = (100 - progress) / 100;
    const maturationMs = totalMaturationSeconds * remainingProgress * 1000;

    const now = new Date();
    const matureTime = new Date(now.getTime() + maturationMs);

    // Save to database
    const tracked = CreatureRepository.create({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        creatureType,
        nickname: nicknameValidation.value,
        startTime: now.toISOString(),
        matureTime: matureTime.toISOString(),
        weight: weight || creatureData.weight,
        notifyMode: notifyMode,
        notifyChannelId: notifyChannel?.id
    });

    // Calculate real buffer based on weight and maturation
    const foodInput = interaction.options.getString('food');
    const foodName = foodInput || getDefaultFoodForCreature(creatureType);
    const foods = (await import('../../../data/foods.json', { with: { type: 'json' } })).default;
    const foodData = foods[foodName] || foods['Raw Meat'];

    const carryWeight = weight || creatureData.weight;
    const currentCarryWeight = carryWeight * (progress / 100);
    const capacity = Math.floor(currentCarryWeight / foodData.weight);

    // Survival time in seconds with full inventory
    const bufferSeconds = calculateBufferTime(capacity, foodData, creatureData, progress / 100, settings);

    // Calculate progress for display
    const progressData = {
        percentage: progress,
        remainingMs: maturationMs,
        bufferMinutes: Math.floor(bufferSeconds / 60),
    };

    const embed = createCreatureEmbed(tracked, progressData);
    embed.setDescription(`🎉 Now tracking **${creatureType}**${nicknameValidation.value ? ` (${nicknameValidation.value})` : ''}!`);
    embed.addFields({
        name: '📅 Estimated Maturity',
        value: `<t:${Math.floor(matureTime.getTime() / 1000)}:R>`,
        inline: true
    });

    await interaction.reply({ embeds: [embed] });
}

/**
 * Find creature type (case-insensitive match)
 */
function findCreatureType(input) {
    const normalized = input.toLowerCase();

    // Exact match first
    for (const name of creatureNames) {
        if (name.toLowerCase() === normalized) {
            return name;
        }
    }

    // Partial match
    for (const name of creatureNames) {
        if (name.toLowerCase().startsWith(normalized)) {
            return name;
        }
    }

    return null;
}
