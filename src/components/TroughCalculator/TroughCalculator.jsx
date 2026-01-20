import { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from './TroughCalculator.module.css';
import { DataPanel, DataInput, LabelWithTooltip } from '../DataPanel';
import { TroughBreakdownModal } from './TroughBreakdownModal';
import { TroughCreatureList } from './TroughCreatureList';
import { TroughTypeSelector } from './TroughTypeSelector';
import { TroughResults } from './TroughResults';
import { FoodSelectorSection } from './FoodSelectorSection';
import { FoodStackRow } from './FoodStackRow';
import { useAutoDuration } from './useAutoDuration';


import { simulateTrough, TROUGH_TYPES } from '@/domain/trough';
import { calculateMaturationTime } from '@/domain/breeding';
import { calculateTroughEfficiency, calculateStacksForDuration } from '@/domain/efficiency';
import { NotificationManager } from '../../infrastructure/NotificationManager';

/**
 * TroughCalculator Component
 * Simulates how long food in a trough will last for multiple creatures.
 */
export function TroughCalculator({
    creatures,
    foods,
    foodLists,
    settings,
    currentCreature,
    currentMaturation,
    currentMaxFood, // New Prop
    gameVersion = 'ASA',
    // New Props from App
    advancedMode,
    useStasisMode,
    notifyEnabled,
    notifyTime,
    onToast
}) {
    const { t } = useTranslation();
    const [creatureList, setCreatureList] = useState([]);
    const [foodStacks, setFoodStacks] = useState({});
    const [troughType, setTroughType] = useState('Normal');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null); // Selected food state

    // Smart Features State
    const [notificationId, setNotificationId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [desiredHours, setDesiredHours] = useState(0);
    const [maewingWeight, setMaewingWeight] = useState(1000);
    const [maewingFood, setMaewingFood] = useState(2000); // ASA: Food stat
    const [nursingEffectiveness, setNursingEffectiveness] = useState(100); // ASE: Nursing Effectiveness %
    const [maewingInputMode, setMaewingInputMode] = useState('basic'); // 'basic' | 'points'
    const [maewingFoodPoints, setMaewingFoodPoints] = useState(30);
    const [breakdownModal, setBreakdownModal] = useState({ isOpen: false, data: null });
    const [isAutoDuration, setIsAutoDuration] = useState(false); // New Auto Toggle

    // Load State from LocalStorage
    useEffect(() => {
        const savedData = localStorage.getItem('ark_trough_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setCreatureList(Array.isArray(parsed.creatureList) ? parsed.creatureList : []);
                setFoodStacks(parsed.foodStacks || {});
                setTroughType(parsed.troughType || 'Normal');
                setDesiredHours(parsed.desiredHours || 0);
                setMaewingWeight(parsed.maewingWeight || 1000);
                setMaewingFood(parsed.maewingFood || 2000);
                setNursingEffectiveness(parsed.nursingEffectiveness || 100);
                setMaewingInputMode(parsed.maewingInputMode || 'basic');
                setMaewingFoodPoints(parsed.maewingFoodPoints || 30);
                setIsAutoDuration(parsed.isAutoDuration || false);
            } catch (e) {
                console.error('Failed to load trough data', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save State to LocalStorage (only after initial load)
    useEffect(() => {
        if (!isLoaded) return; // Don't save until data is loaded
        const dataToSave = {
            creatureList,
            foodStacks,
            troughType,
            desiredHours,
            maewingWeight,
            maewingFood,
            nursingEffectiveness,
            maewingInputMode,
            maewingFoodPoints,
            isAutoDuration
        };
        localStorage.setItem('ark_trough_data', JSON.stringify(dataToSave));
    }, [creatureList, foodStacks, troughType, desiredHours, maewingWeight, maewingFood, nursingEffectiveness, maewingInputMode, maewingFoodPoints, isAutoDuration, isLoaded]);

    // Auto-Duration Logic
    // Track previous state to detect transitions
    const prevAutoRef = useRef(isAutoDuration);

    useEffect(() => {
        // If transitioning from Auto (true) to Manual (false), reset hours
        if (prevAutoRef.current && !isAutoDuration) {
            setDesiredHours(0);
        }
        prevAutoRef.current = isAutoDuration;
    }, [isAutoDuration]);

    useEffect(() => {
        if (isAutoDuration && creatureList.length > 0) {
            let maxSeconds = 0;
            creatureList.forEach(entry => {
                const creatureData = creatures[entry.name];
                if (creatureData) {
                    const totalMaturationTime = calculateMaturationTime(creatureData, settings);
                    const currentProgress = entry.maturation || 0;
                    const remainingSeconds = totalMaturationTime * (1 - currentProgress);
                    if (remainingSeconds > maxSeconds) {
                        maxSeconds = remainingSeconds;
                    }
                }
            });
            const hours = maxSeconds / 3600;
            setDesiredHours(Number(hours.toFixed(2)));
        }
    }, [isAutoDuration, creatureList, settings, creatures]);


    // Calculate available foods based on creatures in the trough
    const availableFoods = useMemo(() => {
        if (!Array.isArray(creatureList)) return [];
        try {
            const foodSet = new Set();
            creatureList.forEach(entry => {
                const creature = creatures[entry.name];
                if (creature) {
                    const creatureFoods = foodLists[creature.type] || foodLists['Carnivore'];
                    creatureFoods.forEach(f => foodSet.add(f));
                }
            });
            return Array.from(foodSet);
        } catch (e) {
            console.error('Error calculating available foods', e);
            return [];
        }
    }, [creatureList, foodLists, creatures]);

    // Get current trough config
    const INVENTORY_HARD_LIMIT = 300; // ARK hard limit for any inventory
    const MAEWING_BASE_FOOD = 2000; // Base food stat for Maewing
    const troughConfig = TROUGH_TYPES[troughType] || TROUGH_TYPES.Normal;

    // Calculate effective spoil multiplier
    // For Maewing, higher Food stat = food lasts longer (more effective feeding)
    let spoilMultiplier = troughConfig.spoilMultiplier;
    let nursingMultiplier = 1;

    if (troughType === 'Maewing') {
        if (gameVersion === 'ASE') {
            // ASE: Nursing Effectiveness % directly multiplies food effectiveness
            // 100% = 1x, 150% = 1.5x, 200% = 2x
            nursingMultiplier = nursingEffectiveness / 100;
        } else {
            // ASA: Food stat affects nursing
            if (maewingInputMode === 'points') {
                // Pro Mode: Exact exponential formula 1.01^points
                nursingMultiplier = Math.pow(1.01, maewingFoodPoints);
            } else {
                // Basic Mode: Linear approximation calibrated from real data
                nursingMultiplier = 1 + maewingFood / 43000;
            }
        }
    }

    // Effective spoil multiplier is just the trough multiplier (Nursing affects consumption, not spoil)
    const effectiveSpoilMultiplier = spoilMultiplier;

    // Create settings object with nursing multiplier
    const simulationSettings = useMemo(() => ({
        ...settings,
        nursingMultiplier,
        useStasisMode
    }), [settings, nursingMultiplier, useStasisMode]);

    // Calculate max slots based on trough type
    let maxSlots;
    if (troughType === 'Maewing') {
        // Calculate max slots based on weight
        // Default to 10.0 per stack (e.g., berries) if no food selected yet
        let stackWeight = 10.0;
        if (selectedFood && foods[selectedFood]) {
            stackWeight = foods[selectedFood].weight * foods[selectedFood].stack;
        }

        const weightBasedSlots = Math.floor(maewingWeight / stackWeight);
        maxSlots = Math.min(weightBasedSlots, INVENTORY_HARD_LIMIT);
    } else {
        maxSlots = troughConfig.slots;
    }

    // Run simulation
    const results = useMemo(() => {
        const res = simulateTrough(creatureList.map(entry => ({
            ...entry,
            creatureData: creatures[entry.name]
        })), foodStacks, foods, foodLists, effectiveSpoilMultiplier, simulationSettings);
        return res;
    }, [creatureList, foodStacks, foods, foodLists, effectiveSpoilMultiplier, simulationSettings, creatures]);

    // Check for efficiency hints
    const efficiency = useMemo(() => {
        if (!foods || availableFoods.length === 0) return { maxStacks: 0, bestFood: null };
        try {
            return calculateTroughEfficiency(results, foods, availableFoods);
        } catch (e) {
            console.error('Efficiency calc error', e);
            return { maxStacks: 0, bestFood: null };
        }
    }, [results, foods, availableFoods]);

    // Auto-select food if none selected
    useEffect(() => {
        if (availableFoods.length > 0) {
            if (!selectedFood || !availableFoods.includes(selectedFood)) {
                setSelectedFood(availableFoods[0]);
            }
        } else {
            setSelectedFood(null);
        }
    }, [availableFoods, selectedFood]);

    // Schedule/Cancel notification based on simulation results
    useEffect(() => {
        if (!notifyEnabled) {
            if (notificationId) {
                NotificationManager.cancel(notificationId);
                setNotificationId(null);
            }
            return;
        }

    }, [results, notifyEnabled, notifyTime, t]);

    const handleNotifyToggle = async () => {
        if (!notifyEnabled) {
            const granted = await NotificationManager.requestPermission();
            if (granted) {
                setNotifyEnabled(true);
            } else {
                alert(t('notifications.perm_denied'));
            }
        } else {
            setNotifyEnabled(false);
        }
    };

    const handleAutoClick = (foodName, stacks, maxDuration = null, forceModal = false) => {
        const targetStacks = (stacks > maxSlots || forceModal) ? maxSlots : stacks;

        // If in Auto Duration mode, we want to replace all stacks to avoid "ghost" items spoiling
        if (isAutoDuration) {
            setFoodStacks({ [foodName]: targetStacks });
        } else {
            updateFoodStacks(foodName, targetStacks);
        }

        if (stacks > maxSlots || forceModal) {
            const fullTroughs = Math.floor(stacks / maxSlots);
            const leftover = stacks % maxSlots;

            let refillCount = 0;
            if (maxDuration > 0 && desiredHours > maxDuration) {
                refillCount = Math.ceil(desiredHours / maxDuration) - 1;
            }

            setBreakdownModal({
                isOpen: true,
                data: { foodName, totalStacks: stacks, fullTroughs, leftover, maxDuration, refillCount }
            });
        }
    };



    const addCurrentCreature = () => {
        if (!currentCreature || !creatures[currentCreature]) return;

        setCreatureList(prev => [...prev, {
            name: currentCreature,
            maturation: currentMaturation,
            quantity: 1,
            maxFood: currentMaxFood || null
        }]);
    };

    const removeCreature = (index) => {
        setCreatureList(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, quantity) => {
        setCreatureList(prev => prev.map((entry, i) =>
            i === index ? { ...entry, quantity: Math.max(1, quantity) } : entry
        ));
    };

    const updateMaturation = (index, percent) => {
        setCreatureList(prev => prev.map((entry, i) =>
            i === index ? { ...entry, maturation: Math.min(100, Math.max(0, percent)) / 100 } : entry
        ));
    };

    const updateMaxFood = (index, value) => {
        setCreatureList(prev => prev.map((entry, i) =>
            i === index ? { ...entry, maxFood: value ? Number(value) : null } : entry
        ));
    };

    const updateFoodStacks = (foodName, stacks) => {
        setFoodStacks(prev => ({
            ...prev,
            [foodName]: Math.max(0, stacks)
        }));
    };

    return (
        <DataPanel
            title={t('panels.trough')}
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
        >
            <TroughCreatureList
                creatureList={creatureList}
                onAdd={addCurrentCreature}
                onRemove={removeCreature}
                onUpdateMaturation={updateMaturation}
                onUpdateQuantity={updateQuantity}
            />

            <TroughTypeSelector
                troughType={troughType}
                onTroughTypeChange={setTroughType}
                gameVersion={gameVersion}
                maewingConfig={{
                    weight: maewingWeight,
                    food: maewingFood,
                    foodPoints: maewingFoodPoints,
                    nursingEffectiveness: nursingEffectiveness,
                    inputMode: maewingInputMode
                }}
                onMaewingConfigChange={(config) => {
                    setMaewingWeight(config.weight);
                    setMaewingFood(config.food);
                    setMaewingFoodPoints(config.foodPoints);
                    setNursingEffectiveness(config.nursingEffectiveness);
                    setMaewingInputMode(config.inputMode);
                }}
            />

            {availableFoods.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <LabelWithTooltip
                            label={t('ui.selected_food')}
                            tooltip={t('tooltips.select_food_type')}
                        />
                        <div style={{ position: 'relative' }}>
                            <select
                                className={styles.select}
                                value={selectedFood || ''}
                                onChange={(e) => setSelectedFood(e.target.value)}
                            >
                                {availableFoods.map(food => (
                                    <option key={food} value={food}>
                                        {food}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Desired Duration Input */}
                    <div className={styles.durationRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LabelWithTooltip
                                label={t('ui.desired_duration')}
                                tooltip={t('tooltips.trough_duration')}
                            />
                            {/* Auto Duration Toggle */}
                            <label className={styles.checkboxLabel} style={{ marginLeft: '12px', fontSize: '0.85rem' }}>
                                <input
                                    type="checkbox"
                                    checked={isAutoDuration}
                                    onChange={(e) => {
                                        setIsAutoDuration(e.target.checked);
                                        // Reset handled by useEffect on transition
                                    }}
                                />
                                <LabelWithTooltip
                                    label={t('ui.auto_duration')}
                                    tooltip={t('ui.auto_duration_tooltip')}
                                    style={{ marginLeft: '4px', cursor: 'help' }}
                                />
                            </label>
                        </div>
                        <div className={styles.durationInputWrapper}>
                            <DataInput
                                key={isAutoDuration ? `auto-${desiredHours}` : 'manual'} // Force remount on value change to ensure UI update
                                value={desiredHours}
                                onChange={(val) => {
                                    setDesiredHours(val);
                                }}
                                min={0}
                                step={1}
                                placeholder="0"
                                showSteppers={false}
                                hideLabel={true}
                                disabled={isAutoDuration}
                            />
                        </div>
                    </div>

                    {/* Selected Food Row */}
                    {selectedFood && (() => {
                        const foodName = selectedFood;
                        const foodData = foods[foodName];
                        if (!foodData) return null;

                        const isRecommended = false; // Feature removed

                        // Prepare creature data
                        const preparedCreatures = creatureList.map(e => ({
                            ...e,
                            creatureData: creatures[e.name]
                        })).filter(e => e.creatureData);

                        // Calculate efficiency for max stacks
                        const efficiency = calculateTroughEfficiency(
                            preparedCreatures,
                            foodData,
                            effectiveSpoilMultiplier,
                            simulationSettings
                        );

                        // Cap to trough slot limit
                        let autoStacks = Math.min(efficiency.maxStacks, maxSlots);
                        let totalCalculatedStacks = autoStacks;
                        let durationInfo = null;
                        let calculatedMaxDuration = null; // New variable for scope
                        let shouldShowModal = false; // Flag to force modal display

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
                            calculatedMaxDuration = fullTroughSim.time / 3600; // Convert seconds to hours

                            shouldShowModal = !durationCalc.isAchievable; // Force modal if limited

                            // If we can't make the duration, default to filling the trough completely
                            // This overrides the efficiency "smart cap" because if we need multiple troughs,
                            // we nearly always want them full.
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
                                {/* Col 1: Name + Badge */}
                                <div className={styles.foodNameContainer}>
                                    <span className={styles.foodName}>{foodName}</span>
                                </div>

                                {/* Col 2: Input */}
                                <DataInput
                                    label={foodName}
                                    tooltip={t('tooltips.food_stack')}
                                    value={foodStacks[foodName]}
                                    onChange={(val) => updateFoodStacks(foodName, val)}
                                    min={0}
                                    step={0.5}
                                    placeholder="0"
                                    showSteppers={false}
                                    className={styles.compactInputWrapper}
                                    hideLabel={true}
                                />

                                {/* Col 3: Label */}
                                <span className={styles.stackLabel}>{t('ui.stacks')}</span>

                                {/* Col 4: Button (or placeholder to keep grid stable) */}
                                {autoStacks > 0 ? (
                                    <button
                                        className={`${styles.autoButton} ${durationInfo ? styles.autoButtonWarning : ''}`}
                                        onClick={() => handleAutoClick(foodName, totalCalculatedStacks, calculatedMaxDuration, shouldShowModal)}
                                        title={durationInfo || t('ui.efficiency_recommendation', { count: autoStacks })}
                                    >
                                        {durationInfo ? t('ui.details') : autoStacks}
                                    </button>
                                ) : (
                                    <div /> /* Empty div to maintain grid cell for alignment */
                                )}
                            </div>
                        );
                    })()}
                </div>
            )}

            {results && <TroughResults
                results={results}
                troughType={troughType}
                onToast={onToast}
            />
            }
            {breakdownModal.isOpen && breakdownModal.data && (
                <TroughBreakdownModal
                    isOpen={breakdownModal.isOpen}
                    onClose={() => setBreakdownModal({ isOpen: false, data: null })}
                    data={breakdownModal.data}
                    onFill={() => {
                        updateFoodStacks(breakdownModal.data.foodName, maxSlots);
                        setBreakdownModal({ isOpen: false, data: null });
                    }}
                    maxSlots={maxSlots}
                    troughType={troughType}
                />
            )}
        </DataPanel>
    );
}

TroughCalculator.propTypes = {
    creatures: PropTypes.object.isRequired,
    foods: PropTypes.object.isRequired,
    foodLists: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    currentCreature: PropTypes.string,
    currentMaturation: PropTypes.number
};

export default TroughCalculator;
