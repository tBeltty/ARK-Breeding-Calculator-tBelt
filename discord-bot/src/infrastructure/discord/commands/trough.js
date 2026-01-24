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

const creatureNames = Object.keys(creatures).sort();
const foodNames = Object.keys(foods).sort();

export const data = new SlashCommandBuilder()
    .setName('trough')
    .setDescription('Calculate trough food requirements')
    .addStringOption(option =>
        option
            .setName('creature')
            .setDescription('The creature type')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addStringOption(option =>
        option
            .setName('food')
            .setDescription('The food type (default: Raw Meat/Mejoberry based on diet)')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addNumberOption(option =>
        option
            .setName('count')
            .setDescription('Number of creatures (default: 1)')
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

    // Find creature
    const creatureName = findMatch(creatureInput, creatureNames);
    if (!creatureName) {
        await interaction.reply({
            embeds: [createErrorEmbed('Unknown Creature', `"${creatureInput}" not found.`)],
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
    const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle(`🥩 Trough Calculator: ${creatureName}`)
        .setDescription(`Food requirements for **${count}** ${creatureName}${count > 1 ? 's' : ''}`)
        .addFields(
            { name: '🍖 Food Type', value: foodName, inline: true },
            { name: '⏱️ Total Time', value: formatTime(maturationTime), inline: true },
            { name: '📊 Server Rates', value: `${settings.maturationSpeed}x`, inline: true },
            { name: '🧮 Total Food Needed', value: `**${totalFoodItems.toLocaleString()}** ${foodName}`, inline: false },
        )
        .setFooter({ text: 'Arktic Assistant • Spoilage not included' })
        .setTimestamp();

    // Add daily breakdown (first 5 days)
    const dailyEntries = Object.entries(dailyFood).slice(0, 5);
    if (dailyEntries.length > 0) {
        const dailyText = dailyEntries
            .map(([day, items]) => `Day ${day}: ${(items * count).toLocaleString()}`)
            .join('\n');
        embed.addFields({ name: '📅 Daily Breakdown', value: dailyText, inline: false });
    }

    await interaction.reply({ embeds: [embed] });
}

function findMatch(input, list) {
    const normalized = input.toLowerCase();
    return list.find(name => name.toLowerCase() === normalized) ||
        list.find(name => name.toLowerCase().startsWith(normalized));
}
