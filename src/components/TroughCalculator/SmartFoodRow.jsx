import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from './TroughCalculator.module.css';
import { DataInput } from '../DataPanel';
import { calculateTroughEfficiency, calculateStacksForDuration } from '@/domain/efficiency';
import { simulateTrough } from '@/domain/trough';

export function SmartFoodRow({
    foodName,
    foodData,
    currentStacks,
    onUpdateStacks,
    creatureList,
    creatures,
    maxSlots,
    desiredHours,
    troughType,
    effectiveSpoilMultiplier,
    simulationSettings,
    foods,
    foodLists,
    onAutoClick
}) {
    const { t } = useTranslation();

    // Complex efficiency calculation logic extracted from TroughCalculator
    const { autoStacks, totalCalculatedStacks, calculatedMaxDuration, durationInfo, shouldShowModal } = useMemo(() => {
        const preparedCreatures = creatureList.map(e => ({
            ...e,
            creatureData: creatures[e.name]
        })).filter(e => e.creatureData);

        const efficiency = calculateTroughEfficiency(
            preparedCreatures,
            foodData,
            effectiveSpoilMultiplier,
            simulationSettings
        );

        let autoStacks = Math.min(efficiency.maxStacks, maxSlots);
        let totalCalculatedStacks = autoStacks;
        let durationInfo = null;
        let calculatedMaxDuration = null;
        let shouldShowModal = false;

        if (desiredHours > 0 && preparedCreatures.length > 0) {
            const durationCalc = calculateStacksForDuration(
                preparedCreatures,
                foodData,
                effectiveSpoilMultiplier,
                simulationSettings,
                desiredHours,
                maxSlots
            );

            // Run actual simulation with full trough to get accurate duration
            const fullTroughStacks = { [foodName]: maxSlots };
            const fullTroughSim = simulateTrough(
                preparedCreatures,
                fullTroughStacks,
                foods,
                foodLists,
                effectiveSpoilMultiplier,
                simulationSettings
            );
            calculatedMaxDuration = fullTroughSim.time / 3600;

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
                    const weightNeeded = Math.min(stacksNeeded * 0.5, 300 * 0.5); // 300 is rough hard limit assumption? from original code?
                    // Actually original code had 300 * 0.5 hardcoded vs stacksNeeded * 0.5.
                    // Let's keep logic identical to original for now.
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

        return { autoStacks, totalCalculatedStacks, calculatedMaxDuration, durationInfo, shouldShowModal };
    }, [
        creatureList, creatures, foodData, effectiveSpoilMultiplier, simulationSettings,
        maxSlots, desiredHours, foodName, foods, foodLists, troughType, t
    ]);

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
                value={currentStacks}
                onChange={onUpdateStacks}
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
                <div />
            )}
        </div>
    );
}

SmartFoodRow.propTypes = {
    foodName: PropTypes.string.isRequired,
    foodData: PropTypes.object.isRequired,
    currentStacks: PropTypes.number,
    onUpdateStacks: PropTypes.func.isRequired,
    creatureList: PropTypes.array.isRequired,
    creatures: PropTypes.object.isRequired,
    maxSlots: PropTypes.number.isRequired,
    desiredHours: PropTypes.number.isRequired,
    troughType: PropTypes.string.isRequired,
    effectiveSpoilMultiplier: PropTypes.number.isRequired,
    simulationSettings: PropTypes.object.isRequired,
    foods: PropTypes.object.isRequired,
    foodLists: PropTypes.object.isRequired,
    onAutoClick: PropTypes.func.isRequired
};
