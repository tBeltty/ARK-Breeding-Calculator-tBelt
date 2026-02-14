/**
 * /trough Command
 * 
 * Calculate food requirements for trough/feeding.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { createErrorEmbed } from '../../../shared/embeds.js';
import creatures from '../../../data/creatures.json' with { type: 'json' };
import foods from '../../../data/foods.json' with { type: 'json' };
import {
    calculateMaturationTime,
    calculateFoodForPeriod,
    foodPointsToItems,
    calculateDailyFood,
    formatTime,
    getCreatureDiet,
    getDefaultFoodForCreature,
    DEFAULT_SETTINGS
} from '../../../domain/breeding.js';
import { t, getLocale } from '../../../shared/i18n.js';

const creatureNames = Object.keys(creatures).sort();
const foodNames = Object.keys(foods).sort();

export const data = new SlashCommandBuilder()
    .setName('trough')
    .setNameLocalizations({ 'es-ES': 'comedero', 'es-419': 'comedero' })
    .setDescription('Calculate trough food requirements')
    .setDescriptionLocalizations({ 'es-ES': 'Calcula la comida necesaria en el comedero', 'es-419': 'Calcula la comida necesaria en el comedero' })
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
            .setDescription('The food type (default: Raw Meat/Mejoberry based on diet)')
            .setDescriptionLocalizations({ 'es-ES': 'Tipo de comida (según dieta)', 'es-419': 'Tipo de comida (según dieta)' })
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addNumberOption(option =>
        option
            .setName('count')
            .setNameLocalizations({ 'es-ES': 'cantidad', 'es-419': 'cantidad' })
            .setDescription('Number of creatures (default: 1)')
            .setDescriptionLocalizations({ 'es-ES': 'Cantidad de criaturas (predeterminado: 1)', 'es-419': 'Cantidad de criaturas (predeterminado: 1)' })
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50)
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
    const foodInput = interaction.options.getString('food');
    const count = interaction.options.getNumber('count') || 1;

    const locale = getLocale(interaction.guildId);

    // Find creature
    const creatureName = findMatch(creatureInput, creatureNames);
    if (!creatureName) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'trough.unknown_creature'), t(locale, 'trough.unknown_creature_desc', { input: creatureInput }))],
            ephemeral: true,
        });
        return;
    }

    const creature = creatures[creatureName];

    // Determine default food based on diet
    let foodName = foodInput ? findMatch(foodInput, foodNames) : getDefaultFoodForCreature(creatureName);
    if (!foodName || !foods[foodName]) {
        foodName = 'Raw Meat'; // Ultimate fallback
    }
    const food = foods[foodName];

    // Get guild settings for rates
    const guild = GuildRepository.findOrCreate(interaction.guildId);
    const settings = {
        ...DEFAULT_SETTINGS,
        maturationSpeed: guild.server_rates || 1,
        hatchSpeed: guild.server_rates || 1,
    };

    // Calculate stats
    const maturationTime = calculateMaturationTime(creature, settings);
    const totalFood = calculateFoodForPeriod(0, maturationTime, creature, settings);
    const totalFoodItems = Math.ceil(foodPointsToItems(totalFood, food)) * count;
    const dailyFood = calculateDailyFood(creature, food, settings);

    // Build embed
    const plural = count > 1 ? 's' : '';
    const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle(t(locale, 'trough.title', { creature: creatureName }))
        .setDescription(t(locale, 'trough.desc', { count, creature: creatureName, plural }))
        .addFields(
            { name: t(locale, 'trough.food_type'), value: foodName, inline: true },
            { name: t(locale, 'trough.total_time'), value: formatTime(maturationTime), inline: true },
            { name: t(locale, 'trough.server_rates'), value: `${settings.maturationSpeed}x`, inline: true },
            { name: t(locale, 'trough.total_food'), value: t(locale, 'trough.total_food_value', { count: totalFoodItems.toLocaleString(), food: foodName }), inline: false },
        )
        .setFooter({ text: 'Arktic Assistant' })
        .setTimestamp();

    // Add daily breakdown (first 5 days)
    const dailyEntries = Object.entries(dailyFood).slice(0, 5);
    if (dailyEntries.length > 0) {
        const dayLabel = locale === 'es' ? 'Día' : 'Day';
        const dailyText = dailyEntries
            .map(([day, items]) => `${dayLabel} ${day}: ${(items * count).toLocaleString()}`)
            .join('\n');
        embed.addFields({ name: t(locale, 'trough.daily_breakdown'), value: dailyText, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
}

function findMatch(input, list) {
    const normalized = input.toLowerCase();
    return list.find(name => name.toLowerCase() === normalized) ||
        list.find(name => name.toLowerCase().startsWith(normalized));
}
