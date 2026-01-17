/**
 * Tests for CalculateBreedingStats Use Case
 */
import { describe, it, expect } from 'vitest';
import { calculateBreedingStats } from './CalculateBreedingStats';
import { DEFAULT_SETTINGS } from '../../domain/breeding';

// Test fixtures
const argentavis = {
    birthtype: 'Incubation',
    type: 'Carnivore',
    basefoodrate: 0.001852,
    babyfoodrate: 25.5,
    extrababyfoodrate: 20,
    agespeed: 0.000003,
    agespeedmult: 1.7,
    eggspeed: 0.005556,
    eggspeedmult: 1.7,
    weight: 400
};

const giganotosaurus = {
    birthtype: 'Incubation',
    type: 'Carnivore',
    basefoodrate: 0.002314,
    babyfoodrate: 45,
    extrababyfoodrate: 20,
    agespeed: 0.000003,
    agespeedmult: 0.3795,
    eggspeed: 0.005556,
    eggspeedmult: 0.1,
    weight: 700
};

const rawMeat = {
    food: 50,
    stack: 40,
    spoil: 600,
    weight: 0.1,
    waste: 0
};

describe('CalculateBreedingStats Use Case', () => {
    describe('Input Validation', () => {
        it('should throw error when creature is missing', () => {
            expect(() => calculateBreedingStats({
                creature: null,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            })).toThrow('Creature data is required');
        });

        it('should throw error when food is missing', () => {
            expect(() => calculateBreedingStats({
                creature: argentavis,
                food: null,
                weight: 400,
                maturationProgress: 0
            })).toThrow('Food data is required');
        });

        it('should use creature default weight when weight is invalid', () => {
            const result = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: -100,
                maturationProgress: 0
            });
            // Should use creature.weight (400) as fallback
            expect(result).toBeDefined();
            expect(result.birthLabel).toBe('Incubation');
        });

        it('should use 0 maturation when maturation progress is invalid', () => {
            const result = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 1.5
            });
            // Should use 0 as fallback
            expect(result).toBeDefined();
            expect(result.maturationTimeComplete).toBe(0);
        });
    });

    describe('Calculation Correctness', () => {
        it('should return all required fields', () => {
            const result = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            });

            expect(result).toHaveProperty('birthLabel');
            expect(result).toHaveProperty('birthTime');
            expect(result).toHaveProperty('maturationTime');
            expect(result).toHaveProperty('babyTime');
            expect(result).toHaveProperty('maturationTimeComplete');
            expect(result).toHaveProperty('maturationTimeRemaining');
            expect(result).toHaveProperty('babyTimeRemaining');
            expect(result).toHaveProperty('totalFoodItems');
            expect(result).toHaveProperty('toJuvFoodItems');
            expect(result).toHaveProperty('toAdultFoodItems');
            expect(result).toHaveProperty('currentBuffer');
            expect(result).toHaveProperty('foodCapacity');
            expect(result).toHaveProperty('currentFoodRate');
        });

        it('should correctly identify birth type', () => {
            const result = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            });

            expect(result.birthLabel).toBe('Incubation');
        });

        it('should calculate maturation time correctly for Argentavis', () => {
            const result = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            });

            // 1 / 0.000003 / 1.7 ≈ 196078 seconds
            expect(result.maturationTime).toBeCloseTo(196078, -2);
        });

        it('should calculate baby time as 10% of maturation', () => {
            const result = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            });

            expect(result.babyTime).toBeCloseTo(result.maturationTime / 10, 0);
        });

        it('should reduce remaining time as maturation progresses', () => {
            const at0 = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            });

            const at50 = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0.5
            });

            expect(at50.maturationTimeRemaining).toBeLessThan(at0.maturationTimeRemaining);
            expect(at50.maturationTimeComplete).toBeGreaterThan(at0.maturationTimeComplete);
        });

        it('should increase food capacity as maturation progresses', () => {
            const at5 = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0.05
            });

            const at50 = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0.5
            });

            expect(at50.foodCapacity).toBeGreaterThan(at5.foodCapacity);
        });

        it('should require more food for Giganotosaurus than Argentavis', () => {
            const argy = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0
            });

            const giga = calculateBreedingStats({
                creature: giganotosaurus,
                food: rawMeat,
                weight: 700,
                maturationProgress: 0
            });

            expect(giga.totalFoodItems).toBeGreaterThan(argy.totalFoodItems);
            expect(giga.maturationTime).toBeGreaterThan(argy.maturationTime);
        });
    });

    describe('Settings Impact', () => {
        it('should halve maturation time with 2x speed', () => {
            const normal = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0,
                settings: DEFAULT_SETTINGS
            });

            const fast = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0,
                settings: { ...DEFAULT_SETTINGS, maturationSpeed: 2 }
            });

            expect(fast.maturationTime).toBeCloseTo(normal.maturationTime / 2, 0);
        });

        it('should apply Gen2 growth effect (2x faster)', () => {
            const normal = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0,
                settings: DEFAULT_SETTINGS
            });

            const gen2 = calculateBreedingStats({
                creature: argentavis,
                food: rawMeat,
                weight: 400,
                maturationProgress: 0,
                settings: { ...DEFAULT_SETTINGS, gen2GrowthEffect: true }
            });

            expect(gen2.maturationTime).toBeCloseTo(normal.maturationTime / 2, 0);
        });
    });
});
