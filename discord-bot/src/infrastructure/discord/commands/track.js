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
import { creatures } from '../../../shared/dataLoader.js';
import {
    calculateMaturationTime,
    calculateBufferTime,
    getCreatureDiet,
    getDefaultFoodForCreature,
    DEFAULT_SETTINGS
} from '../../../domain/breeding.js';
import { logger } from '../../../shared/logger.js';
import { t, getLocale } from '../../../shared/i18n.js';

// Get list of creature names for autocomplete
const creatureNames = Object.keys(creatures).sort();

export const data = new SlashCommandBuilder()
    .setName('track')
    .setNameLocalizations({ 'es-ES': 'criar', 'es-419': 'criar' })
    .setDescription('Start tracking a baby creature')
    .setDescriptionLocalizations({ 'es-ES': 'Empieza a seguir un bebé en crecimiento', 'es-419': 'Empieza a seguir un bebé en crecimiento' })
    .addStringOption(option =>
        option
            .setName('creature')
            .setNameLocalizations({ 'es-ES': 'criatura', 'es-419': 'criatura' })
            .setDescription('The type of creature (e.g., Rex, Wyvern)')
            .setDescriptionLocalizations({ 'es-ES': 'Tipo de criatura (ej. Rex, Wyvern)', 'es-419': 'Tipo de criatura (ej. Rex, Wyvern)' })
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
            .setName('food')
            .setNameLocalizations({ 'es-ES': 'comida', 'es-419': 'comida' })
            .setDescription('Food type for buffer (default: primary for diet)')
            .setDescriptionLocalizations({ 'es-ES': 'Tipo de comida (predeterminado: según dieta)', 'es-419': 'Tipo de comida (predeterminado: según dieta)' })
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
            .setName('nickname')
            .setNameLocalizations({ 'es-ES': 'apodo', 'es-419': 'apodo' })
            .setDescription('Optional nickname for this baby')
            .setDescriptionLocalizations({ 'es-ES': 'Apodo para el bebé (opcional)', 'es-419': 'Apodo para el bebé (opcional)' })
            .setRequired(false)
    )
    .addNumberOption(option =>
        option
            .setName('progress')
            .setNameLocalizations({ 'es-ES': 'progreso', 'es-419': 'progreso' })
            .setDescription('Current maturation % (default: 0)')
            .setDescriptionLocalizations({ 'es-ES': '% de maduración actual (predeterminado: 0)', 'es-419': '% de maduración actual (predeterminado: 0)' })
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(99.9)
    )
    .addNumberOption(option =>
        option
            .setName('weight')
            .setNameLocalizations({ 'es-ES': 'peso', 'es-419': 'peso' })
            .setDescription('Creature weight stat (for accurate buffer)')
            .setDescriptionLocalizations({ 'es-ES': 'Peso de la criatura (para cálculo preciso)', 'es-419': 'Peso de la criatura (para cálculo preciso)' })
            .setRequired(false)
            .setMinValue(1)
    )
    .addStringOption(option =>
        option
            .setName('notify_mode')
            .setNameLocalizations({ 'es-ES': 'aviso', 'es-419': 'aviso' })
            .setDescription('How to notify you')
            .setDescriptionLocalizations({ 'es-ES': 'Cómo avisarte', 'es-419': 'Cómo avisarte' })
            .setRequired(false)
            .addChoices(
                { name: 'DM', value: 'dm' },
                { name: 'Channel', value: 'channel' }
            )
    )
    .addChannelOption(option =>
        option
            .setName('channel')
            .setNameLocalizations({ 'es-ES': 'canal', 'es-419': 'canal' })
            .setDescription('Discord channel for alerts (if mode is channel)')
            .setDescriptionLocalizations({ 'es-ES': 'Canal para alertas (si el modo es canal)', 'es-419': 'Canal para alertas (si el modo es canal)' })
            .setRequired(false)
    );

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

    const locale = getLocale(interaction.guildId);

    // 0. Rate Limit Check
    const { RateLimitService } = await import('../../../application/RateLimitService.js');
    const isAllowed = await RateLimitService.check(`cmd:track:${interaction.user.id}`, 5, 60);
    if (!isAllowed) {
        return interaction.reply({ content: t(locale, 'common.rate_limit', { limit: 5 }), ephemeral: true });
    }

    // 1. Get guild settings and check RBAC
    const { checkCommandPermission } = await import('../security/permissionCheck.js');
    if (!checkCommandPermission(interaction, 'track')) {
        return interaction.reply({ content: t(locale, 'common.no_permission'), ephemeral: true });
    }
    const guild = GuildRepository.findOrCreate(interaction.guildId);

    // Validate creature name
    const creatureValidation = validateCreatureName(creatureInput);
    if (!creatureValidation.valid) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'track.invalid_creature'), creatureValidation.error)],
            ephemeral: true,
        });
        return;
    }

    // Find creature in database
    const creatureType = findCreatureType(creatureValidation.value);
    if (!creatureType) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'track.invalid_creature'), t(locale, 'track.invalid_creature_desc', { input: creatureInput }))],
            ephemeral: true,
        });
        return;
    }

    // Validate nickname
    const nicknameValidation = validateNickname(nicknameInput);
    if (!nicknameValidation.valid) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'track.invalid_nickname'), nicknameValidation.error)],
            ephemeral: true,
        });
        return;
    }

    // Check creature limit
    if (!CreatureRepository.canAddCreature(interaction.guildId, guild.premium_tier)) {
        const limits = { free: 2, pro: 50, tribe: 1000 };
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'track.limit_reached'),
                t(locale, 'track.limit_reached_desc', { max: limits[guild.premium_tier] || 2 })
            )],
            ephemeral: true,
        });
        return;
    }

    // Calculate maturation time
    const creatureData = creatures[creatureType];

    // 1. Determine Rate Mode
    let maturationSpeed = guild.server_rates || 1;
    if (guild.auto_rates === 1) {
        const { ratesService } = await import('../../../application/RatesService.js');
        const officialRates = ratesService.getRates();
        maturationSpeed = officialRates.maturation || 1;
        logger.debug(`[Track] Guild ${interaction.guildId} using Official Rates: ${maturationSpeed}x`);
    }

    const settings = { ...DEFAULT_SETTINGS, maturationSpeed };
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

    let effectiveFoodWeight = foodData.weight;
    if (creatureData.weightmultipliers && creatureData.weightmultipliers[foodName]) {
        effectiveFoodWeight *= creatureData.weightmultipliers[foodName];
    }
    const capacity = Math.floor(currentCarryWeight / effectiveFoodWeight);

    // Survival time in seconds with full inventory
    const bufferSeconds = calculateBufferTime(capacity, foodData, creatureData, progress / 100, settings);

    // Calculate progress for display
    const progressData = {
        percentage: progress,
        remainingMs: maturationMs,
        bufferMinutes: Math.floor(bufferSeconds / 60),
    };

    const nicknamePart = nicknameValidation.value ? t(locale, 'track.nickname_fmt', { nickname: nicknameValidation.value }) : '';
    const embed = createCreatureEmbed(tracked, progressData);
    embed.setDescription(t(locale, 'track.success', { name: creatureType, nickname: nicknamePart }));
    embed.addFields({
        name: t(locale, 'track.mature_at'),
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
