import creatures from '../data/creatures.json' with { type: 'json' };
import foods from '../data/foods.json' with { type: 'json' };
import foodLists from '../data/foodLists.json' with { type: 'json' };

/**
 * ARK Breeding Calculator - Domain Logic
 * Pure calculation functions with no UI or framework dependencies.
 * Following Clean Architecture: this module has no external dependencies.
 */

// Default settings
export const DEFAULT_SETTINGS = {
    consumptionSpeed: 1,
    maturationSpeed: 1,
    hatchSpeed: 1,
    baseMinfoodRate: 0.000155,
    lossFactor: 0,
    gen2HatchEffect: false,
    gen2GrowthEffect: false,
    consumablesSpoilTime: 1,
    stackMultiplier: 1,
};

/**
 * Get the full list of foods a creature can eat.
 * @param {string} creatureType - The type of creature
 * @returns {string[]} Array of food names
 */
export function getCreatureDiet(creatureType) {
    const creature = creatures[creatureType];
    if (!creature) return Object.keys(foods);

    const dietType = creature.type;
    return foodLists[dietType] || foodLists['Carnivore']; // Fallback to Carnivore
}

/**
 * Get the default (primary) food for a creature.
 * @param {string} creatureType - The type of creature
 * @returns {string} Food name
 */
export function getDefaultFoodForCreature(creatureType) {
    const diet = getCreatureDiet(creatureType);
    return diet[0] || 'Raw Meat';
}

/**
 * Calculate maturation time for a creature.
 * @param {Object} creature - Creature data from creatures.json
 * @param {Object} settings - Server settings
 * @returns {number} Maturation time in seconds
 */
export function calculateMaturationTime(creature, settings = DEFAULT_SETTINGS) {
    const baseTime = 1 / creature.agespeed / creature.agespeedmult / settings.maturationSpeed;
    return settings.gen2GrowthEffect ? baseTime / 2 : baseTime;
}

/**
 * Calculate baby phase duration (first 10% of maturation).
 * @param {Object} creature - Creature data
 * @param {Object} settings - Server settings
 * @returns {number} Baby time in seconds
 */
export function calculateBabyTime(creature, settings = DEFAULT_SETTINGS) {
    return calculateMaturationTime(creature, settings) / 10;
}

/**
 * Calculate birth time (incubation or gestation).
 * @param {Object} creature - Creature data
 * @param {Object} settings - Server settings
 * @returns {number} Birth time in seconds
 */
export function calculateBirthTime(creature, settings = DEFAULT_SETTINGS) {
    let baseTime;

    if (creature.birthtype === 'Incubation') {
        baseTime = 100 / creature.eggspeed / creature.eggspeedmult / settings.hatchSpeed;
    } else {
        // Gestation
        baseTime = 1 / creature.gestationspeed / creature.gestationspeedmult / settings.hatchSpeed;
    }

    return settings.gen2HatchEffect ? baseTime / 1.5 : baseTime;
}

/**
 * Calculate food consumption rates.
 * @param {Object} creature - Creature data
 * @param {Object} settings - Server settings
 * @returns {Object} Food rate values
 */
export function calculateFoodRates(creature, settings = DEFAULT_SETTINGS) {
    const maturationTime = calculateMaturationTime(creature, settings);
    const maxFoodRate = creature.basefoodrate * creature.babyfoodrate *
        creature.extrababyfoodrate * settings.consumptionSpeed;
    // Adult rate is simply basefoodrate * consumptionSpeed
    const minFoodRate = creature.basefoodrate * settings.consumptionSpeed;
    const foodRateDecay = (maxFoodRate - minFoodRate) / maturationTime;

    return { maxFoodRate, minFoodRate, foodRateDecay, maturationTime };
}

/**
 * Calculate food consumed during a time period.
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds  
 * @param {Object} creature - Creature data
 * @param {Object} settings - Server settings
 * @returns {number} Food points consumed
 */
export function calculateFoodForPeriod(start, end, creature, settings = DEFAULT_SETTINGS) {
    const { maxFoodRate, foodRateDecay, maturationTime } = calculateFoodRates(creature, settings);

    // Clamp end to maturation time
    const clampedEnd = Math.min(maturationTime, Math.max(start, end));

    const startFoodRate = maxFoodRate - foodRateDecay * start;
    const endFoodRate = maxFoodRate - foodRateDecay * clampedEnd;
    const totalTime = clampedEnd - start;

    // Area under the curve (linear decay)
    return 0.5 * totalTime * (startFoodRate - endFoodRate) + endFoodRate * totalTime;
}

/**
 * Convert food points to food items.
 * @param {number} foodPoints - Food points needed
 * @param {Object} food - Food data from foods.json
 * @param {number} foodMultiplier - Creature-specific food multiplier (default 1)
 * @returns {number} Number of food items needed
 */
export function foodPointsToItems(foodPoints, food, foodMultiplier = 1) {
    return foodPoints / (food.food * foodMultiplier);
}

/**
 * Calculate how long a creature can survive on given food amount, accounting for spoilage.
 * Uses a simulation approach to handle stack-based spoilage and changing consumption rates.
 * 
 * @param {number} initialFoodItems - Starting number of food items
 * @param {Object} food - Food data (including spoilage and stack size)
 * @param {Object} creature - Creature data  
 * @param {number} maturationProgress - Current maturation (0 to 1)
 * @param {Object} settings - Server settings
 * @param {number} consolidationInterval - Seconds between stack consolidation (0 for never)
 * @returns {number} Survival time in seconds
 */
export function calculateBufferTime(initialFoodItems, food, creature, maturationProgress, settings = DEFAULT_SETTINGS, consolidationInterval = 0) {
    const { maxFoodRate, foodRateDecay, maturationTime } = calculateFoodRates(creature, settings);
    const startTime = maturationTime * maturationProgress;

    let currentFoodItems = initialFoodItems;
    let elapsedSeconds = 0;
    const stepSeconds = 60; // 1-minute steps for simulation

    // Spoilage multiplier for dino inventory (4x)
    const inventoryMultiplier = 4;
    const effectiveSpoilTime = (food.spoil || 600) * inventoryMultiplier * settings.consumablesSpoilTime;
    const stackSize = (food.stack || 40) * settings.stackMultiplier;

    // If no food or invalid spoil time, return 0
    if (currentFoodItems <= 0 || effectiveSpoilTime <= 0) return 0;

    const { minFoodRate } = calculateFoodRates(creature, settings);

    // To accurately simulate ARK, we must account for parallel spoilage.
    // Each stack has its own spoil timer.
    let currentStacks = [];
    for (let i = 0; i < currentFoodItems; i += stackSize) {
        currentStacks.push(Math.min(stackSize, currentFoodItems - i));
    }

    while (currentStacks.some(s => s > 0)) {
        // Periodic Consolidation (Auto-Sort)
        if (consolidationInterval > 0 && elapsedSeconds > 0 && elapsedSeconds % consolidationInterval === 0) {
            const totalRemaining = currentStacks.reduce((sum, s) => sum + Math.max(0, s), 0);
            currentStacks = [];
            for (let i = 0; i < totalRemaining; i += stackSize) {
                currentStacks.push(Math.min(stackSize, totalRemaining - i));
            }
        }

        const currentTime = startTime + elapsedSeconds;
        const currentFoodRate = Math.max(minFoodRate, maxFoodRate - foodRateDecay * currentTime);

        // 1. Spoilage: each non-empty stack loses 1 item every 'effectiveSpoilTime'
        const spoilagePerStackInStep = stepSeconds / effectiveSpoilTime;

        // 2. Consumption: points to items
        let itemsToConsume = (currentFoodRate * stepSeconds) / food.food;

        for (let i = 0; i < currentStacks.length; i++) {
            if (currentStacks[i] <= 0) continue;

            // Spoilage affects all stacks
            currentStacks[i] -= spoilagePerStackInStep;

            // Consumption affects the first available stack
            if (itemsToConsume > 0) {
                const consumed = Math.min(Math.max(0, currentStacks[i]), itemsToConsume);
                currentStacks[i] -= consumed;
                itemsToConsume -= consumed;
            }

            if (currentStacks[i] < 0) currentStacks[i] = 0;
        }

        elapsedSeconds += stepSeconds;

        // Safety break
        if (elapsedSeconds > 8640000) break; // 100 days
    }

    return elapsedSeconds;
}

/**
 * Calculate inventory capacity based on creature weight.
 * @param {number} creatureWeight - Weight stat of creature
 * @param {number} maturationProgress - Current maturation (0 to 1)
 * @returns {number} Effective carry weight
 */
export function calculateCarryWeight(creatureWeight, maturationProgress) {
    return creatureWeight * maturationProgress;
}

/**
 * Calculate how many food items fit in inventory.
 * @param {number} carryWeight - Available carry weight
 * @param {Object} food - Food data
 * @returns {number} Max food items that fit
 */
export function calculateFoodCapacity(carryWeight, food) {
    return Math.floor(carryWeight / food.weight);
}

/**
 * Format seconds to human-readable time string.
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time (e.g., "2d:05:30:00")
 */
export function formatTime(seconds) {
    if (!seconds || seconds < 0) return '00:00:00';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n) => n.toString().padStart(2, '0');

    if (days > 0) {
        return `${days}d:${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Format a percentage value.
 * @param {number} value - Value between 0 and 1
 * @returns {string} Formatted percentage (e.g., "10.5")
 */
export function formatPercentage(value) {
    return (Math.ceil(value * 1000) / 10).toFixed(1);
}

/**
 * Calculate daily food requirements.
 * @param {Object} creature - Creature data
 * @param {Object} food - Food data  
 * @param {Object} settings - Server settings
 * @returns {Object} Object with day numbers as keys and food items as values
 */
export function calculateDailyFood(creature, food, settings = DEFAULT_SETTINGS) {
    const dailyFood = {};
    const secondsPerDay = 86400;
    const totalMaturationTime = calculateMaturationTime(creature, settings);

    let day = 1;
    let currentSeconds = 0;

    // Loop until we cover the total maturation time
    while (currentSeconds < totalMaturationTime) {
        const startSec = (day - 1) * secondsPerDay;
        // Cap the end of the day at the total maturation time to avoid calculating food for time after adult
        const endSec = Math.min(day * secondsPerDay, totalMaturationTime);

        const foodPoints = calculateFoodForPeriod(startSec, endSec, creature, settings);

        if (foodPoints > 0) {
            dailyFood[day] = Math.ceil(foodPointsToItems(foodPoints * (1 + settings.lossFactor / 100), food));
        }

        currentSeconds = endSec;
        day++;

        // Safety break for extremely long maturation times (e.g. > 100 days) though unlikely in normal settings
        if (day > 100) break;
    }

    return dailyFood;
}

/**
 * Calculate when hand feeding is no longer needed.
 * Finds the maturation % at which the creature can carry enough food 
 * for the buffer to last until Juvenile (10%).
 * 
 * @param {Object} creature - Creature data
 * @param {Object} food - Food data
 * @param {number} creatureWeight - Weight stat of creature
 * @param {Object} settings - Server settings
 * @returns {Object} { handFeedUntil: percentage, handFeedTime: seconds }
 */
export function calculateHandFeedThreshold(creature, food, creatureWeight, settings = DEFAULT_SETTINGS) {
    const maturationTime = calculateMaturationTime(creature, settings);
    const babyTime = calculateBabyTime(creature, settings);

    // Binary search for the threshold
    let low = 0;
    let high = 0.1; // 10% is max since that's Juvenile
    let threshold = 0;

    for (let i = 0; i < 50; i++) { // 50 iterations for precision
        const mid = (low + high) / 2;
        const currentTime = maturationTime * mid;
        const timeToJuvenile = babyTime - currentTime;

        // Skip if already past Juvenile
        if (timeToJuvenile <= 0) {
            high = mid;
            continue;
        }

        // Calculate food capacity at this maturation
        const currentWeight = creatureWeight * mid;
        const foodCapacity = Math.floor(currentWeight / food.weight);

        // Calculate buffer at this point using simulation (accounts for spoilage)
        const bufferTime = calculateBufferTime(foodCapacity, food, creature, mid, settings);

        // Check if buffer >= time to juvenile
        if (bufferTime >= timeToJuvenile) {
            threshold = mid;
            high = mid; // Can stop feeding earlier
        } else {
            low = mid; // Need to feed longer
        }
    }

    const handFeedTime = maturationTime * threshold;

    return {
        handFeedUntil: threshold * 100, // As percentage
        handFeedTime: handFeedTime
    };
}

