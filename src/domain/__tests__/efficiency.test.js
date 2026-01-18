import { describe, it, expect } from 'vitest'; // Assuming Vitest or Jest
import { calculateTroughEfficiency, calculateTotalFoodToAdult } from '../efficiency';
import { FoodValue } from '../models/FoodValue';
import { DEFAULT_SETTINGS } from '../breeding';

/**
 * Tests for Efficiency Domain Logic
 * Guideline Compliance:
 * - No Mocks (Rule 3)
 * - Behavior Driven (Rule 1)
 */
describe('calculateTroughEfficiency', () => {
    // Fake/Stub Data
    const basicSettings = {
        ...DEFAULT_SETTINGS,
        maturationSpeed: 1,
        consumptionSpeed: 1,
        nursingMultiplier: 1,
        useStasisMode: false
    };

    const basicFood = {
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
    };

    it('returns zero efficiency when no creatures are present', () => {
        const result = calculateTroughEfficiency([], basicFood, 4, basicSettings);

        expect(result.maxStacks).toEqual(0);
        expect(result.consumptionRate.itemsPerSecond).toEqual(0);
    });

    it('calculates consumption correctly for a single creature', () => {
        const creatureList = [{
            creatureData: drakeling,
            maturation: 0.1, // 10% matured
            quantity: 1
        }];

        const result = calculateTroughEfficiency(creatureList, basicFood, 4, basicSettings);

        // Assertions on observable output
        expect(result.consumptionRate.itemsPerSecond).toBeGreaterThan(0);
        expect(result.spoilageItemsPerSecPerStack).toBeGreaterThan(0);
        expect(result.maxStacks).toBeGreaterThan(0);
    });

    it('increases efficiency when Maewing Nursing Effectiveness is high', () => {
        const creatureList = [{
            creatureData: drakeling,
            maturation: 0.1,
            quantity: 1
        }];

        // Standard
        const normalResult = calculateTroughEfficiency(creatureList, basicFood, 4, { ...basicSettings, nursingMultiplier: 1 });

        // High Nursing (2x effectiveness => food worth 2x points => half consumption items/sec)
        const maewingResult = calculateTroughEfficiency(creatureList, basicFood, 4, { ...basicSettings, nursingMultiplier: 2 });

        // Consumption rate (items/sec) should double? No, verify math:
        // Points needed = Constant X
        // Normal Items = X / 50
        // Maewing Items = X / (50 * 2) = X / 100
        // Maewing items/sec MUST be LOWER
        expect(maewingResult.consumptionRate.itemsPerSecond).toBeLessThan(normalResult.consumptionRate.itemsPerSecond);

        // Precision check: should be exactly half
        expect(maewingResult.consumptionRate.itemsPerSecond).toBeCloseTo(normalResult.consumptionRate.itemsPerSecond / 2, 5);

        // Consequently, max efficient stacks should be HIGHER (since we consume slower, we can support more spoilage)
        // Wait, M = C / S. If C decreases, M decreases.
        // Let's re-read efficiency.js: "maxStacks = floor(consumption / spoilRate)"
        // If we consume slower, we can support fewer stacks before spoilage overtakes us?
        // Logic check:
        // Smart Fill Goal: Spoilage <= Consumption.
        // If consumption is very low (babies eat rarely), we can't fill the trough because it will all spoil.
        // So yes, maxStacks should actually be LOWER if consumption drops.
        // Wait, "Nursing Effectiveness increases food value".
        // This makes food "better", so babies eat less often.
        // This actually makes spoilage MORE problematic relative to consumption.
        expect(maewingResult.maxStacks).toBeLessThanOrEqual(normalResult.maxStacks);
    });
});

describe('calculateTotalFoodToAdult', () => {
    const basicSettings = { ...DEFAULT_SETTINGS };

    // Drakeling:
    // Maturation Time ~ 1/agespeed ... simplified for test:
    // average consumption approx (max + min) / 2 * time?
    // Let's rely on behavioral check: increasing maturation should reduce needed food.

    const basicFood = {
        food: 50,
        spoil: 60,
        stack: 100
    };

    const drakeling = {
        agespeed: 1, agespeedmult: 1, // 1 sec maturation for easy math? No, default calculation gives ~ large number
        // Let's use real numbers but check relative logic
        basefoodrate: 0.1,
        babyfoodrate: 1,
        extrababyfoodrate: 1,
        // Mocking calculateMaturationTime result? No mocks allowed.
        // We know calculateMaturationTime returns 1 / agespeed / ...
    };

    // We stub the imported breeding functions? NO MOCKS.
    // We must use the real implementations transitively.

    it('returns 0 if creatures list is empty', () => {
        expect(calculateTotalFoodToAdult([], basicFood, basicSettings)).toBe(0);
    });

    it('returns valid number for a creature', () => {
        const creatures = [{
            creatureData: { ...drakeling, agespeed: 0.001 },
            maturation: 0,
            quantity: 1
        }];

        const result = calculateTotalFoodToAdult(creatures, basicFood, basicSettings);
        expect(result).toBeGreaterThan(0);
    });

    it('requires less food if maturation is higher', () => {
        const baby = [{
            creatureData: { ...drakeling, agespeed: 0.001, basefoodrate: 100 },
            maturation: 0.1,
            quantity: 1
        }];

        const juvenile = [{
            creatureData: { ...drakeling, agespeed: 0.001, basefoodrate: 100 },
            maturation: 0.5,
            quantity: 1
        }];

        const foodForBaby = calculateTotalFoodToAdult(baby, basicFood, basicSettings);
        const foodForJuv = calculateTotalFoodToAdult(juvenile, basicFood, basicSettings);

        expect(foodForJuv).toBeLessThan(foodForBaby);
    });
});
