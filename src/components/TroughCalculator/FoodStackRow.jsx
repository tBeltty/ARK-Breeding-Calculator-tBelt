import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DataInput } from '../DataPanel';
import { calculateTroughEfficiency, calculateStacksForDuration } from '@/domain/efficiency';
import styles from './TroughCalculator.module.css';

/**
 * Food stack input row with auto-calculation logic.
 */
export function FoodStackRow({
    foodName,
    foodData,
    foodStacks,
    onStacksChange,
    preparedCreatures,
    spoilMultiplier,
    simulationSettings,
    maxSlots,
    desiredHours,
    troughType,
    onAutoClick
}) {
    const { t } = useTranslation();

    if (!foodData) return null;

    // Calculate efficiency for max stacks
    const efficiency = calculateTroughEfficiency(
        preparedCreatures,
        foodData,
        spoilMultiplier,
        simulationSettings
    );

    // Cap to trough slot limit
    let autoStacks = Math.min(efficiency.maxStacks, maxSlots);
    let totalCalculatedStacks = autoStacks;
    let durationInfo = null;
    let calculatedMaxDuration = null;
    let shouldShowModal = false;

    if (desiredHours > 0 && preparedCreatures.length > 0) {
        const durationCalc = calculateStacksForDuration(
            preparedCreatures,
            foodData,
            spoilMultiplier,
            simulationSettings,
            desiredHours,
            maxSlots
        );

        calculatedMaxDuration = durationCalc.maxDuration;
        shouldShowModal = !durationCalc.isAchievable;

        if (!durationCalc.isAchievable) {
            autoStacks = maxSlots;
        } else {
            autoStacks = durationCalc.stacks;
        }

        totalCalculatedStacks = durationCalc.totalStacks || durationCalc.stacks;

        if (!durationCalc.isAchievable) {
            if (durationCalc.limitReason === 'spoilage') {
                durationInfo = t('ui.impossible_spoilage', {
                    hours: durationCalc.maxDuration.toFixed(1)
                });
            } else if (troughType === 'Maewing') {
                const itemsPerSec = efficiency.consumptionRate ? efficiency.consumptionRate.itemsPerSecond : 0;
                const itemsNeeded = itemsPerSec * (desiredHours * 3600);
                const stacksNeeded = Math.ceil(itemsNeeded / foodData.stack);
                const weightNeeded = Math.min(stacksNeeded * 0.5, 300 * 0.5);
                durationInfo = t('ui.maewing_weight_needed', {
                    weight: weightNeeded.toFixed(0),
                    hours: durationCalc.maxDuration.toFixed(1)
                });
            } else {
                durationInfo = t('ui.troughs_needed', {
                    count: durationCalc.troughsNeeded,
                    hours: durationCalc.maxDuration.toFixed(1)
                });
            }
        }
    }

    return (
        <div className={styles.foodRow}>
            {/* Col 1: Name */}
            <div className={styles.foodNameContainer}>
                <span className={styles.foodName}>{foodName}</span>
            </div>

            {/* Col 2: Input */}
            <DataInput
                label={foodName}
                tooltip={t('tooltips.food_stack')}
                value={foodStacks[foodName]}
                onChange={(val) => onStacksChange(foodName, val)}
                min={0}
                step={0.5}
                placeholder="0"
                showSteppers={false}
                className={styles.compactInputWrapper}
                hideLabel={true}
            />

            {/* Col 3: Label */}
            <span className={styles.stackLabel}>{t('ui.stacks')}</span>

            {/* Col 4: Button */}
            {autoStacks > 0 ? (
                <button
                    className={`${styles.autoButton} ${durationInfo ? styles.autoButtonWarning : ''}`}
                    onClick={() => onAutoClick(foodName, totalCalculatedStacks, calculatedMaxDuration, shouldShowModal)}
                    title={durationInfo || t('ui.efficiency_recommendation', { count: autoStacks })}
                >
                    {durationInfo ? t('ui.details') : autoStacks}
                </button>
            ) : (
                <div /> /* Empty div for grid alignment */
            )}
        </div>
    );
}

FoodStackRow.propTypes = {
    foodName: PropTypes.string.isRequired,
    foodData: PropTypes.object,
    foodStacks: PropTypes.object.isRequired,
    onStacksChange: PropTypes.func.isRequired,
    preparedCreatures: PropTypes.array.isRequired,
    spoilMultiplier: PropTypes.number.isRequired,
    simulationSettings: PropTypes.object.isRequired,
    maxSlots: PropTypes.number.isRequired,
    desiredHours: PropTypes.number.isRequired,
    troughType: PropTypes.string.isRequired,
    onAutoClick: PropTypes.func.isRequired
};
