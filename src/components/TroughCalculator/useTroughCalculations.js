import { useMemo } from 'react';
import { simulateTrough, TROUGH_TYPES } from '@/domain/trough';

/**
 * Custom hook for trough calculation logic.
 * Encapsulates all memoized calculations for efficiency, simulation, and available foods.
 * 
 * @param {Array} creatureList - Creatures in trough
 * @param {Object} foodStacks - Food stack counts
 * @param {Object} foods - Food data lookup
 * @param {Object} foodLists - Food lists by creature type
 * @param {Object} creatures - Creature data lookup
 * @param {string} troughType - Current trough type
 * @param {Object} settings - Server settings with nursing multiplier
 * @param {number} spoilMultiplier - Effective spoil multiplier
 */
export function useTroughCalculations(
    creatureList,
    foodStacks,
    foods,
    foodLists,
    creatures,
    troughType,
    simulationSettings,
    spoilMultiplier,
    consolidationInterval = 0
) {
    // Calculate available foods based on creatures in the trough
    const availableFoods = useMemo(() => {
        if (!Array.isArray(creatureList)) return [];
        try {
            const foodSet = new Set();
            creatureList.forEach(entry => {
                const creature = creatures[entry.name];
                if (creature) {
                    const creatureFoods = foodLists[creature.type] || foodLists['Carnivore'];
                    creatureFoods.forEach(f => foodSet.add(f));
                }
            });
            return Array.from(foodSet);
        } catch (e) {
            console.error('Error calculating available foods', e);
            return [];
        }
    }, [creatureList, foodLists, creatures]);

    // Run simulation
    const results = useMemo(() => {
        const preparedCreatures = creatureList.map(entry => ({
            ...entry,
            creatureData: creatures[entry.name]
        }));
        return simulateTrough(
            preparedCreatures,
            foodStacks,
            foods,
            foodLists,
            spoilMultiplier,
            simulationSettings,
            consolidationInterval
        );
    }, [creatureList, foodStacks, foods, foodLists, spoilMultiplier, simulationSettings, creatures, consolidationInterval]);

    return {
        availableFoods,
        results
    };
}
