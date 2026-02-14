/**
 * CalculateBreedingStats Use Case
 * Application layer use case for calculating all breeding statistics.
 * 
 * Following Clean Architecture:
 * - Represents a meaningful business intent
 * - Depends only on Domain layer
 * - Framework agnostic
 */

import {
    calculateMaturationTime,
    calculateBabyTime,
    calculateBirthTime,
    calculateFoodRates,
    calculateFoodForPeriod,
    foodPointsToItems,
    calculateHandFeedThreshold,
    calculateDailyFood,
    calculateBufferTime,
    DEFAULT_SETTINGS
} from '../../domain/breeding.js';

/**
 * @typedef {Object} BreedingStatsInput
 * @property {Object} creature - Creature data from creatures.json
 * @property {Object} food - Food data from foods.json
 * @property {number} weight - Creature weight stat
 * @property {number} maxFood - Creature max food stat (points)
 * @property {number} maturationProgress - Current maturation (0 to 1)
 * @property {Object} settings - Server settings
 * @property {number} consolidationInterval - Seconds between stack auto-sort
 */

/**
 * @typedef {Object} BreedingStatsResult
 * @property {string} birthLabel - "Incubation" or "Gestation"
 * @property {number} birthTime - Time for hatch/gestation in seconds
 * @property {number} maturationTime - Total maturation time in seconds
 * @property {number} babyTime - Baby phase duration in seconds
 * @property {number} maturationTimeComplete - Time already elapsed
 * @property {number} maturationTimeRemaining - Time until adult
 * @property {number} babyTimeRemaining - Time until juvenile
 * @property {number} totalFoodItems - Total food needed from birth to adult
 * @property {number} toJuvFoodItems - Food needed to reach juvenile
 * @property {number} toAdultFoodItems - Food needed to reach adult
 * @property {number} currentBuffer - How long creature survives with full inventory
 * @property {number} foodCapacity - How many food items fit in inventory
 * @property {number} currentFoodRate - Current food consumption rate per minute
 */

/**
 * Calculate all breeding statistics for a creature.
 * 
 * @param {BreedingStatsInput} input - Input parameters
 * @returns {BreedingStatsResult} All calculated breeding statistics
 */
export function calculateBreedingStats({ creature, food, weight, maxFood, maturationProgress, settings = DEFAULT_SETTINGS, consolidationInterval = 0 }) {
    // Validate inputs
    if (!creature) {
        throw new Error('Creature data is required');
    }
    if (!food) {
        throw new Error('Food data is required');
    }

    // Use safe defaults for numeric inputs (allows UI to function during edits)
    const safeWeight = weight > 0 ? weight : creature.weight || 1;
    const safeMaturation = (maturationProgress >= 0 && maturationProgress <= 1)
        ? maturationProgress
        : 0;

    // Calculate time-based stats
    const maturationTime = calculateMaturationTime(creature, settings);
    const babyTime = calculateBabyTime(creature, settings);
    const birthTime = calculateBirthTime(creature, settings);

    // Calculate food rates
    const { maxFoodRate, foodRateDecay } = calculateFoodRates(creature, settings);

    // Calculate time progress
    const maturationTimeComplete = maturationTime * safeMaturation;
    const maturationTimeRemaining = maturationTime - maturationTimeComplete;
    const babyTimeRemaining = Math.max(0, babyTime - maturationTimeComplete);

    // Calculate food requirements
    const totalFoodPoints = calculateFoodForPeriod(0, maturationTime, creature, settings);
    const totalJuvFoodPoints = calculateFoodForPeriod(0, babyTime, creature, settings);

    const remainingToJuvFoodPoints = calculateFoodForPeriod(maturationTimeComplete, babyTime, creature, settings);
    const remainingToAdultFoodPoints = calculateFoodForPeriod(maturationTimeComplete, maturationTime, creature, settings);

    // Calculate inventory-based stats (Weighted Capacity)
    const currentWeight = safeWeight * safeMaturation;
    let itemsByWeight = Math.floor(currentWeight / food.weight);

    // Stomach Capacity (Max Food Stat)
    // If user provided a maxFood stat, the dino cannot hold more than that in its stomach (in pts)
    const maxFoodItems = (maxFood > 0) ? Math.floor(maxFood / food.food) : Infinity;

    // Slot Limit (Dinos usually have 300 slots)
    const slotLimit = 300 * (settings.stackMultiplier || 1);
    const itemsBySlots = slotLimit * (food.stack || 40);

    // Final Capacity is the minimum of weight, stomach, and slots
    const foodCapacity = Math.min(itemsByWeight, maxFoodItems, itemsBySlots);

    const currentFoodRate = maxFoodRate - foodRateDecay * maturationTimeComplete;

    // Calculate buffer using simulation (accounts for parallel spoilage and auto-sort)
    const currentBuffer = calculateBufferTime(foodCapacity, food, creature, safeMaturation, settings, consolidationInterval);

    // Calculate hand feed threshold
    const handFeed = calculateHandFeedThreshold(creature, food, safeWeight, settings);

    // Calculate daily food breakdown
    const dailyFood = calculateDailyFood(creature, food, settings);

    return {
        birthLabel: creature.birthtype,
        birthTime,
        maturationTime,
        babyTime,
        maturationTimeComplete,
        maturationTimeRemaining,
        babyTimeRemaining,
        totalFoodItems: Math.ceil(foodPointsToItems(totalFoodPoints, food)),
        totalJuvFoodItems: Math.ceil(foodPointsToItems(totalJuvFoodPoints, food)),
        toJuvFoodItems: Math.ceil(foodPointsToItems(remainingToJuvFoodPoints, food)),
        toAdultFoodItems: Math.ceil(foodPointsToItems(remainingToAdultFoodPoints, food)),
        currentBuffer,
        foodCapacity,
        currentFoodRate: currentFoodRate * 60, // Convert to per minute
        handFeedUntil: handFeed.handFeedUntil,
        totalHandFeedPct: handFeed.handFeedUntil, // Explicit alias for UI
        handFeedTime: handFeed.handFeedTime,
        dailyFood // Expose for UI breakdown
    };
}

export default calculateBreedingStats;
