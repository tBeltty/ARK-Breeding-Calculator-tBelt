import { describe, it, expect } from 'vitest';
import { getCreatureDiet, getDefaultFoodForCreature } from './breeding.js';

describe('Breeding Domain Logic - Food Mapping', () => {
    it('should return correct diet for a Carnivore (Allosaurus)', () => {
        const diet = getCreatureDiet('Allosaurus');
        expect(diet).toContain('Raw Meat');
        expect(diet).toContain('Kibble');
        expect(diet).not.toContain('Mejoberry');
    });

    it('should return correct diet for specialized Archelon', () => {
        const diet = getCreatureDiet('Archelon');
        expect(diet).toContain('Bio Toxin');
        expect(diet).toContain('Vegetables (Archelon)');
        expect(diet).not.toContain('Raw Meat');
    });

    it('should return correct default food for Archelon', () => {
        const defaultFood = getDefaultFoodForCreature('Archelon');
        expect(defaultFood).toBe('Vegetables (Archelon)');
    });

    it('should return correct diet for Bloodstalker', () => {
        const diet = getCreatureDiet('Bloodstalker');
        expect(diet).toContain('Blood Pack');
    });

    it('should return correct diet for Microraptor', () => {
        const diet = getCreatureDiet('Microraptor');
        expect(diet).toContain('Rare Flower');
    });

    it('should return correct diet for Wyvern', () => {
        const diet = getCreatureDiet('Wyvern');
        expect(diet).toContain('Wyvern Milk');
    });

    it('should return correct diet for specialized Desmodus (BloodStalker diet)', () => {
        const diet = getCreatureDiet('Desmodus');
        expect(diet).toContain('Blood Pack');
    });

    it('should return correct diet for Carrion eaters (Dreadmare)', () => {
        const diet = getCreatureDiet('Dreadmare');
        expect(diet).toContain('Spoiled Meat');
    });

    it('should fallback to all foods for unknown creature', () => {
        const diet = getCreatureDiet('UnknownDino');
        expect(diet.length).toBeGreaterThan(10); // Should return all foods
    });
});
