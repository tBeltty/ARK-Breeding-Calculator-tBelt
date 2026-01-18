/**
 * Trough Simulation Domain Logic
 * Pure calculation functions for trough food management.
 * 
 * Following Clean Architecture: no UI or framework dependencies.
 */

import { calculateFoodRates, calculateMaturationTime } from './breeding';
import { FoodValue } from './models/FoodValue';

/**
 * Trough type configurations.
 * - spoilMultiplier: how much longer food lasts vs player inventory
 *   (base food.spoil is player inventory time, e.g. 600s = 10min for meat)
 * - slots: max inventory slots (null = weight-based for Maewing)
 */
export const TROUGH_TYPES = {
    Normal: { spoilMultiplier: 4, slots: 60 },        // 4x player = 40 min for meat
    'Tek Trough': { spoilMultiplier: 100, slots: 100 }, // 100x player
    'Maewing': { spoilMultiplier: 4, slots: null }    // Same as dino inventory
};

/**
 * Simulate trough consumption for multiple creatures.
 * This is the core simulation that calculates how long food lasts.
 * 
 * @param {Array} creatureList - Array of {name, maturation, quantity, creatureData}
 * @param {Object} foodStacks - Object with food names as keys and stack counts as values
 * @param {Object} foods - All food data
 * @param {Object} foodLists - Food type mappings
 * @param {number} troughMultiplier - Spoil time multiplier based on trough type
 * @param {Object} settings - Server settings
 * @returns {Object} Simulation results
 */
export function simulateTrough(creatureList, foodStacks, foods, foodLists, troughMultiplier, settings) {
    if (!creatureList || creatureList.length === 0) {
        return {
            time: 0,
            totalFood: 0,
            eatenFood: 0,
            spoiledFood: 0,
            wastedPoints: 0
        };
    }

    // Build stacks array from food stacks input
    const stacks = [];
    const foodOrder = Object.keys(foods);

    for (const foodName of foodOrder) {
        if (foodStacks[foodName] === undefined || foodStacks[foodName] <= 0) continue;

        const food = foods[foodName];
        const fullStacks = Math.floor(foodStacks[foodName]);
        const partialStack = foodStacks[foodName] - fullStacks;

        for (let i = 0; i < Math.ceil(foodStacks[foodName]); i++) {
            stacks.push({
                type: foodName,
                stackSize: i === fullStacks ? Math.floor(food.stack * partialStack) : food.stack,
                stackSpoil: food.spoil * troughMultiplier,
                foodSpoil: food.spoil * troughMultiplier,
                food: food.food,
                waste: food.waste || 0
            });
        }
    }

    // Initialize creatures for simulation
    const troughCreatures = [];
    for (const entry of creatureList) {
        for (let i = 0; i < entry.quantity; i++) {
            const creature = entry.creatureData;
            const maturationTime = calculateMaturationTime(creature, settings);
            const { maxFoodRate, minFoodRate, foodRateDecay } = calculateFoodRates(creature, settings);

            troughCreatures.push({
                name: entry.name,
                maturation: entry.maturation,
                maturationTime,
                maxFoodRate,
                minFoodRate,
                foodRateDecay,
                foodRate: maxFoodRate - foodRateDecay * entry.maturation * maturationTime,
                hunger: 0,
                maxFood: entry.maxFood || null,
                foods: foodLists[creature.type] || foodLists['Carnivore'],
                foodMultipliers: creature.foodmultipliers || createDefaultMultipliers(foodLists[creature.type]),
                wasteMultipliers: creature.wastemultipliers || createDefaultMultipliers(foodLists[creature.type])
            });
        }
    }

    // Tracking variables
    let spoiledFood = 0;
    let spoiledPoints = 0;
    let eatenFood = 0;
    let eatenPoints = 0;
    let wastedPoints = 0;
    let totalStackCount = stacks.filter(s => s.stackSize > 0).length;

    // Simulation loop (1 second per tick, max 3 days)
    const MAX_TIME = 60 * 60 * 24 * 3;
    let time = 0;

    while (totalStackCount > 0 && time < MAX_TIME) {
        time++;

        // Process each creature
        for (const creature of troughCreatures) {
            // Skip adults
            if (creature.foodRate < creature.minFoodRate) continue;

            // Update metabolic food rate
            creature.foodRate -= creature.foodRateDecay;
            let currentConsumption = creature.foodRate;

            // Render Logic: Add Growth Fill Consumption
            if (creature.maxFood && creature.maturationTime > 0) {
                const maturationSpeed = 1 / creature.maturationTime;
                if (Number.isFinite(maturationSpeed)) {
                    const growthFillRate = 0.75 * creature.maxFood * maturationSpeed;
                    currentConsumption += growthFillRate;
                }
            }

            creature.hunger += currentConsumption;

            // Skip if can't eat anything yet
            if (creature.hunger < 20) continue;

            // Try to eat from available stacks
            for (const stack of stacks) {
                if (stack.stackSize <= 0) continue;
                if (!creature.foods.includes(stack.type)) continue;

                const foodMult = creature.foodMultipliers[stack.type] || 1;
                const wasteMult = creature.wasteMultipliers[stack.type] || 1;
                const nursingMult = settings.nursingMultiplier || 1; // Maewing bonus

                // Use FoodValue VO
                const baseFood = new FoodValue(stack.food, stack.foodSpoil);
                const effectiveFood = baseFood.withNursingEffectiveness(nursingMult);
                const effectiveFoodPoints = effectiveFood.points * foodMult;

                if (effectiveFoodPoints < creature.hunger) {
                    stack.stackSize--;
                    eatenFood++;
                    eatenPoints += effectiveFoodPoints;
                    wastedPoints += stack.waste * wasteMult;
                    creature.hunger -= effectiveFoodPoints;

                    if (stack.stackSize === 0) {
                        totalStackCount--;
                    }
                }
                break; // Each creature eats from one stack per tick
            }
        }

        // Process spoilage
        for (const stack of stacks) {
            if (stack.stackSize <= 0) continue;

            stack.stackSpoil--;
            if (stack.stackSpoil <= 0) {
                stack.stackSize--;
                stack.stackSpoil = stack.foodSpoil;
                spoiledFood++;
                spoiledPoints += stack.food;
                wastedPoints += stack.waste;

                if (stack.stackSize === 0) {
                    totalStackCount--;
                }
            }
        }
    }

    return {
        time,
        totalFood: eatenFood + spoiledFood,
        totalPoints: eatenPoints + spoiledPoints + wastedPoints,
        eatenFood,
        eatenPoints,
        spoiledFood,
        spoiledPoints,
        wastedPoints
    };
}

/**
 * Create default food multipliers (all 1).
 */
function createDefaultMultipliers(foodList) {
    if (!foodList) return {};
    const multipliers = {};
    for (const food of foodList) {
        multipliers[food] = 1;
    }
    return multipliers;
}

/**
 * Calculate how many stacks of food are needed for a duration.
 * 
 * @param {Object} creature - Creature data
 * @param {Object} food - Food data
 * @param {number} duration - Target duration in seconds
 * @param {number} maturationProgress - Current maturation (0 to 1)
 * @param {Object} settings - Server settings
 * @returns {number} Number of stacks needed
 */
export function calculateStacksForDuration(creature, food, duration, maturationProgress, settings) {
    const maturationTime = calculateMaturationTime(creature, settings);
    const { maxFoodRate, foodRateDecay } = calculateFoodRates(creature, settings);

    const currentTime = maturationTime * maturationProgress;
    const currentRate = maxFoodRate - foodRateDecay * currentTime;

    // Estimate total food consumed
    const avgRate = currentRate - (foodRateDecay * duration / 2);
    const totalFoodPoints = avgRate * duration;

    const foodItems = totalFoodPoints / food.food;
    return Math.ceil(foodItems / food.stack);
}

export default { simulateTrough, TROUGH_TYPES, calculateStacksForDuration };
