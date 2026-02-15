/**
 * /buffer Command
 * 
 * Calculate how long current food supply will last.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { createErrorEmbed } from '../../../shared/embeds.js';
import { creatures, foods } from '../../../shared/dataLoader.js';
import {
    calculateMaturationTime,
    calculateBufferTime,
    calculateFoodCapacity,
    calculateCarryWeight,
    formatTime,
    getCreatureDiet,
    getDefaultFoodForCreature,
    DEFAULT_SETTINGS
} from '../../../domain/breeding.js';
import { t, getLocale } from '../../../shared/i18n.js';

const creatureNames = Object.keys(creatures).sort();
const foodNames = Object.keys(foods).sort();

export const data = new SlashCommandBuilder()
    .setName('buffer')
    .setNameLocalizations({ 'es-ES': 'comida', 'es-419': 'comida' })
    .setDescription('Calculate how long food supply will last')
    .setDescriptionLocalizations({ 'es-ES': 'Calcula cuánto dura la comida', 'es-419': 'Calcula cuánto dura la comida' })
    .addStringOption(option =>
        option
            .setName('creature')
            .setNameLocalizations({ 'es-ES': 'criatura', 'es-419': 'criatura' })
            .setDescription('The creature type')
            .setDescriptionLocalizations({ 'es-ES': 'Tipo de criatura', 'es-419': 'Tipo de criatura' })
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
            .setName('food')
            .setNameLocalizations({ 'es-ES': 'comida', 'es-419': 'comida' })
            .setDescription('Food type (default: based on diet)')
            .setDescriptionLocalizations({ 'es-ES': 'Tipo de comida (según dieta)', 'es-419': 'Tipo de comida (según dieta)' })
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addNumberOption(option =>
        option
            .setName('progress')
            .setNameLocalizations({ 'es-ES': 'progreso', 'es-419': 'progreso' })
            .setDescription('Current maturation % (default: 5)')
            .setDescriptionLocalizations({ 'es-ES': '% de maduración actual (predeterminado: 5)', 'es-419': '% de maduración actual (predeterminado: 5)' })
            .setRequired(false)
            .setMinValue(0.1)
            .setMaxValue(100)
    )
    .addNumberOption(option =>
        option
            .setName('food_amount')
            .setNameLocalizations({ 'es-ES': 'cantidad', 'es-419': 'cantidad' })
            .setDescription('Food items available (default: inventory capacity)')
            .setDescriptionLocalizations({ 'es-ES': 'Comida disponible (predeterminado: capacidad)', 'es-419': 'Comida disponible (predeterminado: capacidad)' })
            .setRequired(false)
            .setMinValue(1)
    )
    .addNumberOption(option =>
        option
            .setName('weight')
            .setNameLocalizations({ 'es-ES': 'peso', 'es-419': 'peso' })
            .setDescription('Override creature weight stat')
            .setDescriptionLocalizations({ 'es-ES': 'Peso de la criatura (override)', 'es-419': 'Peso de la criatura (override)' })
            .setRequired(false)
            .setMinValue(1)
    );

export async function autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    let choices;
    if (focusedOption.name === 'creature') {
        choices = creatureNames.filter(name =>
            name.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
    } else if (focusedOption.name === 'food') {
        const selectedCreature = interaction.options.getString('creature');
        const diet = selectedCreature && creatures[selectedCreature] ? getCreatureDiet(selectedCreature) : foodNames;
        choices = diet.filter(name =>
            name.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
    }

    await interaction.respond(
        choices.slice(0, 25).map(name => ({ name, value: name }))
    );
}

export async function execute(interaction) {
    const creatureInput = interaction.options.getString('creature');
    const progress = (interaction.options.getNumber('progress') || 5) / 100; // Convert to 0-1
    const foodAmountInput = interaction.options.getNumber('food_amount');
    const foodInput = interaction.options.getString('food');
    const weightInput = interaction.options.getNumber('weight');

    const locale = getLocale(interaction.guildId);

    // Find creature
    const creatureName = findMatch(creatureInput, creatureNames);
    if (!creatureName) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'buffer.unknown_creature'), t(locale, 'buffer.unknown_creature_desc', { input: creatureInput }))],
            ephemeral: true,
        });
        return;
    }

    const creature = creatures[creatureName];

    // Determine food
    let foodName = foodInput ? findMatch(foodInput, foodNames) : getDefaultFoodForCreature(creatureName);
    if (!foodName || !foods[foodName]) {
        foodName = 'Raw Meat';
    }
    const food = { ...foods[foodName], name: foodName };

    // Get guild settings
    const guild = GuildRepository.findOrCreate(interaction.guildId);
    const settings = {
        ...DEFAULT_SETTINGS,
        maturationSpeed: guild.server_rates || 1,
    };

    // Calculate values
    const maturationTime = calculateMaturationTime(creature, settings);
    const carryWeight = calculateCarryWeight(weightInput || creature.weight, progress);
    const foodCapacity = calculateFoodCapacity(carryWeight, food, creature);
    const foodAmount = foodAmountInput || foodCapacity;
    const bufferTime = calculateBufferTime(foodAmount, food, creature, progress, settings);

    // Time until 10% (juvenile)
    const timeToJuvenile = Math.max(0, (0.1 - progress) * maturationTime);
    const bufferCoversJuvenile = bufferTime >= timeToJuvenile;

    // Build embed
    const statusColor = bufferCoversJuvenile ? 0x22C55E : 0xF59E0B;
    const statusEmoji = bufferCoversJuvenile ? '✅' : '⚠️';
    const statusText = bufferCoversJuvenile ? t(locale, 'buffer.safe') : t(locale, 'buffer.danger');

    const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(t(locale, 'buffer.title', { creature: creatureName }))
        .setDescription(`${statusEmoji} ${statusText}`)
        .addFields(
            { name: t(locale, 'buffer.maturation'), value: `${(progress * 100).toFixed(1)}%`, inline: true },
            { name: t(locale, 'buffer.food'), value: foodName, inline: true },
            { name: t(locale, 'buffer.amount'), value: t(locale, 'buffer.amount_value', { count: foodAmount }), inline: true },
            { name: t(locale, 'buffer.buffer_time'), value: `**${formatTime(bufferTime)}**`, inline: true },
            { name: t(locale, 'buffer.to_juvenile'), value: formatTime(timeToJuvenile), inline: true },
            { name: t(locale, 'buffer.carry_weight'), value: `${carryWeight.toFixed(1)}`, inline: true },
        )
        .setFooter({ text: 'Arktic Assistant' })
        .setTimestamp();

    if (progress < 0.1 && !bufferCoversJuvenile) {
        embed.addFields({
            name: t(locale, 'buffer.tip'),
            value: t(locale, 'buffer.tip_desc', { time: formatTime(timeToJuvenile - bufferTime) }),
            inline: false,
        });
    }

    await interaction.reply({ embeds: [embed] });
}

function findMatch(input, list) {
    const normalized = input.toLowerCase();
    return list.find(name => name.toLowerCase() === normalized) ||
        list.find(name => name.toLowerCase().startsWith(normalized));
}
