/**
 * ConsumptionRate Value Object
 * Encapsulates the rate at which food is consumed.
 * Is immutable and enforces invariants.
 */
export class ConsumptionRate {
    /**
     * @param {number} pointsPerSecond - Food points consumed per second
     * @param {number} itemsPerSecond - Food items consumed per second
     */
    constructor(pointsPerSecond, itemsPerSecond) {
        if (pointsPerSecond < 0) {
            throw new Error('ConsumptionRate: pointsPerSecond cannot be negative');
        }
        // Items per second can be 0 or Infinity, but not negative
        if (itemsPerSecond < 0) {
            throw new Error('ConsumptionRate: itemsPerSecond cannot be negative');
        }

        this.pointsPerSecond = pointsPerSecond;
        this.itemsPerSecond = itemsPerSecond;

        Object.freeze(this);
    }

    /**
     * Factory from raw calculation
     * @param {number} pointsPerSecond 
     * @param {FoodValue} foodValue 
     * @returns {ConsumptionRate}
     */
    static fromPointsAndFood(pointsPerSecond, foodValue) {
        if (!foodValue || foodValue.points === 0) {
            return new ConsumptionRate(pointsPerSecond, 0); // Avoid division by zero
        }
        return new ConsumptionRate(pointsPerSecond, pointsPerSecond / foodValue.points);
    }
}
