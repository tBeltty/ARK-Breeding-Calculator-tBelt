/**
 * Unit tests for ARK Breeding Calculator domain logic
 */
import { describe, it, expect } from 'vitest';
import {
    calculateMaturationTime,
    calculateBabyTime,
    calculateBirthTime,
    calculateFoodRates,
    calculateFoodForPeriod,
    foodPointsToItems,
    calculateHandFeedThreshold,
    formatTime,
    formatPercentage,
    DEFAULT_SETTINGS
} from './breeding';

// Sample creature data (Argentavis from ARK)
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

// Giganotosaurus for testing longer maturation
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

// Basilosaurus (gestation creature)
const basilosaurus = {
    birthtype: 'Gestation',
    type: 'Carnivore',
    basefoodrate: 0.002929,
    babyfoodrate: 25.5,
    extrababyfoodrate: 20,
    agespeed: 0.000003,
    agespeedmult: 0.8,
    gestationspeed: 0.000035,
    gestationspeedmult: 1.0,
    weight: 700
};

describe('calculateMaturationTime', () => {
    it('should calculate correct maturation time with default settings', () => {
        const time = calculateMaturationTime(argentavis);
        // 1 / 0.000003 / 1.7 / 1 = 196078.43...
        expect(time).toBeCloseTo(196078.43, 0);
    });

    it('should halve time with gen2 growth effect', () => {
        const normalTime = calculateMaturationTime(argentavis);
        const gen2Time = calculateMaturationTime(argentavis, { ...DEFAULT_SETTINGS, gen2GrowthEffect: true });
        expect(gen2Time).toBeCloseTo(normalTime / 2, 0);
    });

    it('should scale with maturation speed multiplier', () => {
        const normalTime = calculateMaturationTime(argentavis);
        const fastTime = calculateMaturationTime(argentavis, { ...DEFAULT_SETTINGS, maturationSpeed: 2 });
        expect(fastTime).toBeCloseTo(normalTime / 2, 0);
    });
});

describe('calculateBabyTime', () => {
    it('should be 10% of maturation time', () => {
        const matTime = calculateMaturationTime(argentavis);
        const babyTime = calculateBabyTime(argentavis);
        expect(babyTime).toBeCloseTo(matTime / 10, 0);
    });
});

describe('calculateBirthTime', () => {
    it('should calculate incubation time for egg-laying creatures', () => {
        const time = calculateBirthTime(argentavis);
        // 100 / 0.005556 / 1.7 / 1 ≈ 10587
        expect(time).toBeCloseTo(10587, -1);
    });

    it('should calculate gestation time for mammals', () => {
        const time = calculateBirthTime(basilosaurus);
        // 1 / 0.000035 / 1.0 / 1 = 28571.4...
        expect(time).toBeCloseTo(28571.4, 0);
    });

    it('should apply gen2 hatch effect (1.5x faster)', () => {
        const normalTime = calculateBirthTime(argentavis);
        const gen2Time = calculateBirthTime(argentavis, { ...DEFAULT_SETTINGS, gen2HatchEffect: true });
        expect(gen2Time).toBeCloseTo(normalTime / 1.5, 0);
    });
});

describe('calculateFoodRates', () => {
    it('should calculate max food rate correctly', () => {
        const rates = calculateFoodRates(argentavis);
        // 0.001852 * 25.5 * 20 * 1 = 0.94452
        expect(rates.maxFoodRate).toBeCloseTo(0.94452, 4);
    });

    it('should scale with consumption speed', () => {
        const normal = calculateFoodRates(argentavis);
        const fast = calculateFoodRates(argentavis, { ...DEFAULT_SETTINGS, consumptionSpeed: 2 });
        expect(fast.maxFoodRate).toBeCloseTo(normal.maxFoodRate * 2, 4);
    });
});

describe('calculateFoodForPeriod', () => {
    it('should return 0 for zero-length period', () => {
        const food = calculateFoodForPeriod(1000, 1000, argentavis);
        expect(food).toBe(0);
    });

    it('should be positive for valid period', () => {
        const food = calculateFoodForPeriod(0, 3600, argentavis); // First hour
        expect(food).toBeGreaterThan(0);
    });

    it('should decrease over time (food rate decay)', () => {
        const firstHour = calculateFoodForPeriod(0, 3600, argentavis);
        const tenthHour = calculateFoodForPeriod(32400, 36000, argentavis);
        expect(firstHour).toBeGreaterThan(tenthHour);
    });
});

describe('foodPointsToItems', () => {
    it('should convert points to items correctly', () => {
        const rawMeat = { food: 50, stack: 40, spoil: 600, weight: 0.1, waste: 0 };
        const items = foodPointsToItems(500, rawMeat);
        expect(items).toBe(10);
    });

    it('should apply food multiplier', () => {
        const rawMeat = { food: 50, stack: 40, spoil: 600, weight: 0.1, waste: 0 };
        const items = foodPointsToItems(500, rawMeat, 0.5);
        expect(items).toBe(20);
    });
});

describe('formatTime', () => {
    it('should format seconds correctly', () => {
        expect(formatTime(90)).toBe('00:01:30');
    });

    it('should format hours correctly', () => {
        expect(formatTime(3661)).toBe('01:01:01');
    });

    it('should format days correctly', () => {
        expect(formatTime(90061)).toBe('1d:01:01:01');
    });

    it('should handle zero', () => {
        expect(formatTime(0)).toBe('00:00:00');
    });

    it('should handle negative', () => {
        expect(formatTime(-100)).toBe('00:00:00');
    });
});

describe('formatPercentage', () => {
    it('should format percentage with one decimal', () => {
        expect(formatPercentage(0.105)).toBe('10.5');
    });

    it('should round up correctly', () => {
        expect(formatPercentage(0.1054)).toBe('10.6');
    });
});

// Test food data
const rawMeat = {
    food: 50,
    stack: 40,
    spoil: 600,
    weight: 0.1,
    waste: 0
};

describe('calculateHandFeedThreshold', () => {
    it('should return handFeedUntil as a percentage', () => {
        const result = calculateHandFeedThreshold(argentavis, rawMeat, 400, DEFAULT_SETTINGS);
        expect(result).toHaveProperty('handFeedUntil');
        expect(result).toHaveProperty('handFeedTime');
        expect(typeof result.handFeedUntil).toBe('number');
        expect(result.handFeedUntil).toBeGreaterThanOrEqual(0);
        expect(result.handFeedUntil).toBeLessThanOrEqual(10); // Max is 10% (juvenile)
    });

    it('should return handFeedTime in seconds', () => {
        const result = calculateHandFeedThreshold(argentavis, rawMeat, 400, DEFAULT_SETTINGS);
        expect(result.handFeedTime).toBeGreaterThanOrEqual(0);
    });

    it('should require longer hand feeding for lighter food', () => {
        const lightFood = { ...rawMeat, weight: 0.5 }; // Heavier = less capacity

        const withLight = calculateHandFeedThreshold(argentavis, rawMeat, 400, DEFAULT_SETTINGS);
        const withHeavy = calculateHandFeedThreshold(argentavis, lightFood, 400, DEFAULT_SETTINGS);

        // Heavier food means less capacity, so longer hand feed
        expect(withHeavy.handFeedUntil).toBeGreaterThanOrEqual(withLight.handFeedUntil);
    });

    it('should scale with maturation speed setting', () => {
        const normal = calculateHandFeedThreshold(argentavis, rawMeat, 400, DEFAULT_SETTINGS);
        const fast = calculateHandFeedThreshold(argentavis, rawMeat, 400, {
            ...DEFAULT_SETTINGS,
            maturationSpeed: 2
        });

        // Faster maturation = less absolute hand feed time
        expect(fast.handFeedTime).toBeLessThan(normal.handFeedTime);
    });
});

