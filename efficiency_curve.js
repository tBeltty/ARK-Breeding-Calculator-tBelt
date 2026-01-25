
function calculateBufferTime(initialFoodItems, food, basefoodrate, settings, consolidationInterval) {
    let elapsedSeconds = 0;
    const stepSeconds = 60;
    const inventoryMultiplier = 4;
    const effectiveSpoilTime = (food.spoil || 600) * inventoryMultiplier * settings.consumablesSpoilTime;
    const stackSize = (food.stack || 40) * settings.stackMultiplier;

    let currentStacks = [];
    const buildStacks = (totalItems) => {
        const newStacks = [];
        for (let i = 0; i < totalItems; i += stackSize) {
            newStacks.push(Math.min(stackSize, totalItems - i));
        }
        return newStacks;
    };

    currentStacks = buildStacks(initialFoodItems);

    while (currentStacks.some(s => s > 0) && elapsedSeconds < 10000000) {
        if (consolidationInterval > 0 && elapsedSeconds > 0 && (elapsedSeconds % consolidationInterval === 0)) {
            const totalRemaining = currentStacks.reduce((sum, s) => sum + Math.max(0, s), 0);
            currentStacks = buildStacks(totalRemaining);
        }

        const spoilagePerStackInStep = stepSeconds / effectiveSpoilTime;
        let itemsToConsume = (basefoodrate * stepSeconds) / food.food;

        for (let i = 0; i < currentStacks.length; i++) {
            if (currentStacks[i] <= 0) continue;
            currentStacks[i] -= spoilagePerStackInStep;
            if (itemsToConsume > 0) {
                const consumed = Math.min(Math.max(0, currentStacks[i]), itemsToConsume);
                currentStacks[i] -= consumed;
                itemsToConsume -= consumed;
            }
            if (currentStacks[i] < 0) currentStacks[i] = 0;
        }
        elapsedSeconds += stepSeconds;
    }
    return elapsedSeconds;
}

const food = { food: 50, stack: 40, spoil: 600 };
const settings = { consumablesSpoilTime: 1, stackMultiplier: 1 };
const items = 6614;
const manaRate = 0.001852;

const intervals = [0, 1, 4, 8, 12, 18, 24];
console.log("| Interval | Hours | Days | Info |");
console.log("|----------|-------|------|------|");
intervals.forEach(h => {
    const res = calculateBufferTime(items, food, manaRate, settings, h * 3600);
    const hours = (res / 3600).toFixed(1);
    const days = (res / 86400).toFixed(2);
    console.log(`| ${h === 0 ? 'OFF' : h + 'h'} | ${hours}h | ${days}d | ${h === 12 ? '**Optimal?**' : ''} |`);
});
