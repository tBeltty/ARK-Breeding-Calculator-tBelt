/**
 * FoodValue Value Object
 * Encapsulates the nutritional value and spoilage properties of food.
 * Is immutable and enforces invariants.
 */
export class FoodValue {
    /**
     * @param {number} points - Nutritional value of the food
     * @param {number} spoilTime - Time in seconds until one item spoils
     * @param {number} waste - Points wasted when spoiled (optional)
     */
    constructor(points, spoilTime, waste = 0) {
        if (points < 0) {
            throw new Error('FoodValue: points cannot be negative');
        }
        if (spoilTime < 0) {
            throw new Error('FoodValue: spoilTime cannot be negative');
        }

        this.points = points;
        this.spoilTime = spoilTime;
        this.waste = waste;

        Object.freeze(this);
    }

    /**
     * Creates a new FoodValue with modified spoil time
     * @param {number} multiplier 
     * @returns {FoodValue}
     */
    withSpoilMultiplier(multiplier) {
        return new FoodValue(this.points, this.spoilTime * multiplier, this.waste);
    }

    /**
     * Creates a new FoodValue reflected nursing effectiveness (ASE/ASA Maewing)
     * @param {number} multiplier - Nursing multiplier (increases points)
     * @returns {FoodValue}
     */
    withNursingEffectiveness(multiplier) {
        return new FoodValue(this.points * multiplier, this.spoilTime, this.waste);
    }

    /**
     * Calculates total points for a given quantity
     * @param {number} quantity 
     * @returns {number}
     */
    getTotalPoints(quantity) {
        return this.points * quantity;
    }
}
