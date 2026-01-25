import { describe, it, expect } from 'vitest';
import { simulateTrough } from '../trough';
import { DEFAULT_SETTINGS } from '../breeding';

/**
 * Tests for Trough Simulation Logic
 * Guideline Compliance:
 * - No Mocks (Rule 3)
 */
describe('simulateTrough', () => {
    // Fake Data
    const basicSettings = {
        ...DEFAULT_SETTINGS,
        maturationSpeed: 1,
        consumptionSpeed: 1,
        nursingMultiplier: 1
    };

    const meat = {
        food: 50,
        spoil: 600, // 10 mins
        stack: 20
    };

    const drakeling = {
        name: 'Drakeling',
        agespeed: 0.000003,
        agespeedmult: 1,
        basefoodrate: 0.001302,
        babyfoodrate: 25.5,
        extrababyfoodrate: 20,
        foodmultipliers: { 'Raw Meat': 1 },
        type: 'Carnivore'
    };

    const foodLists = {
        'Carnivore': ['Raw Meat']
    };

    const foods = {
        'Raw Meat': meat
    };

    it('simulates consumption properly', () => {
        const creatureList = [{
            name: 'Drakeling',
            maturation: 0.1,
            quantity: 1,
            creatureData: drakeling
        }];

        const foodStacks = { 'Raw Meat': 5 }; // 5 stacks
        const troughMultiplier = 4; // Trough

        const result = simulateTrough(creatureList, foodStacks, foods, foodLists, troughMultiplier, basicSettings);

        expect(result.time).toBeGreaterThan(0);
        expect(result.eatenFood).toBeGreaterThan(0);
        expect(result.totalFood).toBeGreaterThan(0);
    });

    it('applies Maewing Nursing Multiplier to extend food duration via effective points', () => {
        const creatureList = [{
            name: 'Drakeling',
            maturation: 0.1,
            quantity: 1,
            creatureData: drakeling
        }];

        const foodStacks = { 'Raw Meat': 1 };

        // Run 1: Normal Trough
        const resNormal = simulateTrough(
            creatureList,
            foodStacks,
            foods,
            foodLists,
            4,
            { ...basicSettings, nursingMultiplier: 1 }
        );

        // Run 2: Maewing with 10x Effectiveness
        // Food points = 50 * 10 = 500. Creature should eat 1/10th as often.
        const resMaewing = simulateTrough(
            creatureList,
            foodStacks,
            foods,
            foodLists,
            4,
            { ...basicSettings, nursingMultiplier: 10 }
        );

        // Since food is worth more, it should support the baby logic longer?
        // Or fewer items are eaten.
        expect(resMaewing.eatenFood).toBeLessThan(resNormal.eatenFood);

        // If fewer items are eaten, they last longer against hunger, BUT spoilage is constant.
        // However, since we eat less often, we might hit spoilage limits?
        // Wait, "Duration" (time) should be higher or equal.
        expect(resMaewing.time).toBeGreaterThanOrEqual(resNormal.time);
    });
});
