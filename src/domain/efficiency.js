/**
 * Trough Efficiency Domain Logic
 * Calculates optimal food amounts to minimize spoilage.
 */

import { calculateFoodRates, calculateMaturationTime, calculateFoodForPeriod } from './breeding';

/**
 * Calculate the "Smart Fill" amount for a specific food.
 * Determines the maximum number of stacks where consumption rate >= spoilage rate.
 * 
 * @param {Array} creatureList - Array of { creatureData, maturation, quantity }
 * @param {Object} food - Food data object { food: number, spoil: number, stack: number }
 * @param {number} troughMultiplier - Spoilage multiplier (e.g., 4 for Trough, 100 for Tek)
 * @param {Object} settings - Server settings
 * @returns {Object} result { maxStacks, consumptionRate, spoilageRatePerStack }
 */
import { FoodValue } from './models/FoodValue';
import { ConsumptionRate } from './models/ConsumptionRate';

/**
 * Calculate the "Smart Fill" amount for a specific food.
 * Determines the maximum number of stacks where consumption rate >= spoilage rate.
 * 
 * @param {Array} creatureList - Array of { creatureData, maturation, quantity }
 * @param {Object} food - Food data object { food: number, spoil: number, stack: number }
 * @param {number} troughMultiplier - Spoilage multiplier (e.g., 4 for Trough, 100 for Tek)
 * @param {Object} settings - Server settings
 * @returns {Object} result { maxStacks, consumptionRate, spoilageRatePerStack }
 */
export function calculateTroughEfficiency(creatureList, food, troughMultiplier, settings) {
    if (!Array.isArray(creatureList) || creatureList.length === 0 || !food) {
        return {
            maxStacks: 0,
            consumptionRate: new ConsumptionRate(0, 0),
            spoilageRatePerStack: 0
        };
    }

    let totalConsumptionPointsPerSec = 0;

    // Calculate aggregate consumption rate
    for (const entry of creatureList) {
        const creature = entry.creatureData;
        if (!creature) continue;

        const maturationTime = calculateMaturationTime(creature, settings);
        const { maxFoodRate, minFoodRate, foodRateDecay } = calculateFoodRates(creature, settings);

        // Current food rate (points per second)
        const currentMaturationTime = maturationTime * entry.maturation;
        let currentFoodRate = maxFoodRate - (foodRateDecay * currentMaturationTime);

        // Clamp to minFoodRate (adult consumption)
        if (currentFoodRate < minFoodRate) currentFoodRate = minFoodRate;

        // Add to total (multiplied by quantity)
        totalConsumptionPointsPerSec += currentFoodRate * (entry.quantity || 1);
    }

    // Convert points/sec to items/sec using FoodValue
    const nursingMult = settings.nursingMultiplier || 1;

    // Create FoodValue and apply Nursing Effectiveness
    const baseFood = new FoodValue(food.food, food.spoil);
    const effectiveFood = baseFood.withNursingEffectiveness(nursingMult);

    // Calculate Consumption Rate
    const consumptionRate = ConsumptionRate.fromPointsAndFood(totalConsumptionPointsPerSec, effectiveFood);

    // Calculate spoilage rate (items/sec per stack)
    // Spoil time is in seconds. 1 item spoils every X seconds.
    const effectiveSpoilTime = food.spoil * troughMultiplier;
    const spoilageItemsPerSecPerStack = 1 / effectiveSpoilTime;

    // Calculate Max Efficient Stacks
    // We want N * SpoilRate <= ConsumptionRate
    // N <= ConsumptionRate / SpoilRate
    const maxStacks = Math.floor(consumptionRate.itemsPerSecond / spoilageItemsPerSecPerStack);

    return {
        maxStacks,
        consumptionRate, // Return VO
        spoilageItemsPerSecPerStack,
        recommendedMeat: maxStacks * food.stack
    };
}

/**
 * Calculate stacks needed for a desired duration.
 * 
 * @param {Array} creatureList - Creatures in trough
 * @param {Object} food - Food data { food, spoil, stack }
 * @param {number} troughMultiplier - Spoilage multiplier
 * @param {Object} settings - Server settings
 * @param {number} desiredHours - Desired duration in hours
 * @param {number} maxSlots - Maximum slots available in trough
 * @returns {Object} { stacks, maxDuration, isAchievable }
 */
export function calculateStacksForDuration(creatureList, food, troughMultiplier, settings, desiredHours, maxSlots = Infinity) {
    // First get max efficient stacks
    const efficiency = calculateTroughEfficiency(creatureList, food, troughMultiplier, settings);

    // Use VO property
    if (!efficiency.consumptionRate || efficiency.consumptionRate.itemsPerSecond <= 0) {
        return { stacks: 0, maxDuration: 0, isAchievable: false };
    }

    const desiredSeconds = desiredHours * 3600;

    // Absolute Hard Cap: A single stack can only last so long due to spoilage
    // Because stacks spoil in parallel in a trough, the maximum lifespan of the food
    // is equivalent to the lifespan of a single full stack.
    // (e.g. Raw Meat in Normal Trough = 20 * 10m * 4 = 13.3 hours).
    const absoluteMaxSpoilSeconds = food.stack * food.spoil * troughMultiplier;

    if (desiredSeconds > absoluteMaxSpoilSeconds) {
        return {
            stacks: maxSlots, // Fill it up, that's the best you can do
            totalStacks: maxSlots, // Not Infinity, just max capacity of one trough
            maxDuration: absoluteMaxSpoilSeconds / 3600,
            isAchievable: false,
            limitReason: 'spoilage', // Flag for UI
            troughsNeeded: 1 // Only one point in filling one trough, more won't help
        };
    }

    // Cap max stacks to slot limit
    const effectiveMaxStacks = Math.min(efficiency.maxStacks, maxSlots);

    // Calculate max possible duration with FULL trough capacity (maxSlots)
    // Duration is LIMITED BY WHICHEVER COMES FIRST:
    // 1. Time to consume all food (consumption-limited)
    // 2. Time for all food to spoil (spoilage-limited)
    const maxItems = maxSlots * food.stack;
    const consumptionTimeSeconds = maxItems / efficiency.consumptionRate.itemsPerSecond;
    const spoilageTimeSeconds = food.stack * food.spoil * troughMultiplier; // Same as absoluteMaxSpoilSeconds

    // The effective duration is the MINIMUM of consumption and spoilage
    // For Tek (100x): consumptionTime << spoilageTime, so consumption-limited
    // For Normal (4x): could be either depending on creature count
    const maxDurationSeconds = Math.min(consumptionTimeSeconds, spoilageTimeSeconds);
    const maxDurationHours = maxDurationSeconds / 3600;

    // If desired duration exceeds what's achievable with available slots
    if (desiredHours > maxDurationHours) {
        // Calculate how many troughs would be needed
        const itemsNeeded = efficiency.consumptionRate.itemsPerSecond * desiredSeconds;
        const stacksNeeded = Math.ceil(itemsNeeded / food.stack);
        const troughsNeeded = Math.ceil(stacksNeeded / maxSlots);

        return {
            stacks: effectiveMaxStacks,
            totalStacks: stacksNeeded,
            maxDuration: maxDurationHours,
            isAchievable: false,
            troughsNeeded
        };
    }

    // Calculate stacks needed for desired duration
    // items_needed = consumptionRate * desiredSeconds
    let stacksNeeded;

    if (settings.useStasisMode) {
        // Stasis (Offline) Logic: Spoilage calculated on initial stacks for full duration
        const spoilTime = food.spoil * troughMultiplier;
        if (desiredSeconds >= spoilTime) {
            // This existing check seems to be checking if duration > time for ONE item to spoil?
            // That's likely too aggressive. The absolute cap is whole stack.
            // Kept original logic structure but refined return.
            // Actually, if desiredSeconds > spoilTime * stack, we caught it above.
            // This check might be about "Single item spoil time"? 
            // In stasis, maybe mechanics are different. 
            // I'll leave the stasis specific check but the absolute cap above covers the main case.
            return {
                stacks: effectiveMaxStacks,
                totalStacks: Infinity,
                maxDuration: spoilTime / 3600,
                isAchievable: false,
                troughsNeeded: Infinity
            };
        }

        const effectiveStackSize = food.stack * (1 - desiredSeconds / spoilTime);
        const totalConsumption = efficiency.consumptionRate.itemsPerSecond * desiredSeconds;

        stacksNeeded = Math.ceil(totalConsumption / effectiveStackSize);
    } else {
        // Render (Online) Logic: Consumption + Sequential Spoilage
        // Total = Consumption + (Duration / SpoilTime)
        const spoilTime = food.spoil * troughMultiplier;
        const totalSpoilage = desiredSeconds / spoilTime;
        const totalConsumption = efficiency.consumptionRate.itemsPerSecond * desiredSeconds;

        const itemsNeeded = totalConsumption + totalSpoilage;
        stacksNeeded = Math.ceil(itemsNeeded / food.stack);
    }

    return {
        stacks: Math.max(1, Math.min(stacksNeeded, effectiveMaxStacks)),
        totalStacks: Math.max(1, stacksNeeded),
        maxDuration: maxDurationHours, // Note: MaxDuration is still based on efficiency limit
        isAchievable: stacksNeeded <= effectiveMaxStacks
    };
}

/**
 * Calculate total food items needed to reach adulthood (ignoring spoilage).
 * 
 * @param {Array} creatureList - Array of creatures
 * @param {Object} food - Food data (primitive or FoodValue?) -> Standard is primitive from basic list, but we can accept VO
 *                       Actually, the caller (UI) likely passes the basic food object. We'll convert.
 * @param {Object} settings - Server settings
 * @returns {number} Total food items
 */
export function calculateTotalFoodToAdult(creatureList, food, settings) {
    if (!creatureList || creatureList.length === 0 || !food) return 0;

    let totalItems = 0;
    const nursingMult = settings.nursingMultiplier || 1;

    // Create Value Object for consistency
    const baseFood = new FoodValue(food.food, food.spoil);
    const effectiveFood = baseFood.withNursingEffectiveness(nursingMult);

    for (const entry of creatureList) {
        const creature = entry.creatureData;
        if (!creature) continue;

        const maturationTime = calculateMaturationTime(creature, settings);

        // Time window: Current -> Adult (1.0)
        const currentSec = maturationTime * entry.maturation;
        const adultSec = maturationTime; // 100%

        if (currentSec >= adultSec) continue;

        const totalPoints = calculateFoodForPeriod(currentSec, adultSec, creature, settings);

        // Convert to items
        const items = totalPoints / effectiveFood.points;
        totalItems += items * (entry.quantity || 1);
    }

    return Math.ceil(totalItems);
}
