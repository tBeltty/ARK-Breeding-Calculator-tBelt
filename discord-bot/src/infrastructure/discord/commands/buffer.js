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

const creatureNames = Object.keys(creatures).sort();
const foodNames = Object.keys(foods).sort();

export const data = new SlashCommandBuilder()
    .setName('buffer')
    .setDescription('Calculate how long food supply will last')
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
            .setDescription('Food type (default: based on diet)')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addNumberOption(option =>
        option
            .setName('progress')
            .setDescription('Current maturation % (default: 5)')
            .setRequired(false)
            .setMinValue(0.1)
            .setMaxValue(100)
    )
    .addNumberOption(option =>
        option
            .setName('food_amount')
            .setDescription('Food items available (default: inventory capacity)')
            .setRequired(false)
            .setMinValue(1)
    )
    .addNumberOption(option =>
        option
            .setName('weight')
            .setDescription('Override creature weight stat')
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

    // Determine food
    let foodName = foodInput ? findMatch(foodInput, foodNames) : getDefaultFoodForCreature(creatureName);
    if (!foodName || !foods[foodName]) {
        foodName = 'Raw Meat';
    }
    const food = foods[foodName];

    // Get guild settings
    const guild = GuildRepository.findOrCreate(interaction.guildId);
    const settings = {
        ...DEFAULT_SETTINGS,
        maturationSpeed: guild.server_rates || 1,
    };

    // Calculate values
    const maturationTime = calculateMaturationTime(creature, settings);
    const carryWeight = calculateCarryWeight(weightInput || creature.weight, progress);
    const foodCapacity = calculateFoodCapacity(carryWeight, food);
    const foodAmount = foodAmountInput || foodCapacity;
    const bufferTime = calculateBufferTime(foodAmount, food, creature, progress, settings);

    // Time until 10% (juvenile)
    const timeToJuvenile = Math.max(0, (0.1 - progress) * maturationTime);
    const bufferCoversJuvenile = bufferTime >= timeToJuvenile;

    // Build embed
    const statusColor = bufferCoversJuvenile ? 0x22C55E : 0xF59E0B; // Green if safe, yellow if not
    const statusEmoji = bufferCoversJuvenile ? '✅' : '⚠️';

    const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle(`⏰ Buffer Time: ${creatureName}`)
        .setDescription(`${statusEmoji} ${bufferCoversJuvenile ? 'Safe until Juvenile!' : 'May need hand-feeding!'}`)
        .addFields(
            { name: '📊 Maturation', value: `${(progress * 100).toFixed(1)}%`, inline: true },
            { name: '🍖 Food', value: foodName, inline: true },
            { name: '📦 Amount', value: `${foodAmount} items`, inline: true },
            { name: '⏱️ Buffer Time', value: `**${formatTime(bufferTime)}**`, inline: true },
            { name: '🐣 To Juvenile', value: formatTime(timeToJuvenile), inline: true },
            { name: '⚖️ Carry Weight', value: `${carryWeight.toFixed(1)}`, inline: true },
        )
        .setFooter({ text: 'Arktic Assistant' })
        .setTimestamp();

    if (progress < 0.1 && !bufferCoversJuvenile) {
        embed.addFields({
            name: '💡 Tip',
            value: `You need **${formatTime(timeToJuvenile - bufferTime)}** more buffer to reach Juvenile safely.`,
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
