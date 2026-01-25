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

import { SmartFoodRow } from './SmartFoodRow';
import { TroughDurationInput } from './TroughDurationInput';


import { simulateTrough, TROUGH_TYPES } from '@/domain/trough';
import { calculateMaturationTime } from '@/domain/breeding';
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
    useStasisMode,
    notifyEnabled,
    notifyTime,
    onToast
}) {
    const { t } = useTranslation();
    const [creatureList, setCreatureList] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                return Array.isArray(parsed.creatureList) ? parsed.creatureList : [];
            }
        } catch (e) { console.error(e); }
        return [];
    });

    const [foodStacks, setFoodStacks] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) {
                return JSON.parse(savedData).foodStacks || {};
            }
        } catch { return {}; }
        return {};
    });

    const [troughType, setTroughType] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).troughType || 'Normal';
        } catch { return 'Normal'; }
        return 'Normal';
    });

    const [desiredHours, setDesiredHours] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).desiredHours || 0;
        } catch { return 0; }
        return 0;
    });

    const [maewingWeight, setMaewingWeight] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).maewingWeight || 1000;
        } catch { return 1000; }
        return 1000;
    });

    const [maewingFood, setMaewingFood] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).maewingFood || 2000;
        } catch { return 2000; }
        return 2000;
    });

    const [nursingEffectiveness, setNursingEffectiveness] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).nursingEffectiveness || 100;
        } catch { return 100; }
        return 100;
    });

    const [maewingInputMode, setMaewingInputMode] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).maewingInputMode || 'basic';
        } catch { return 'basic'; }
        return 'basic';
    });

    const [maewingFoodPoints, setMaewingFoodPoints] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).maewingFoodPoints || 30;
        } catch { return 30; }
        return 30;
    });

    const [isAutoDuration, setIsAutoDuration] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).isAutoDuration || false;
        } catch { return false; }
        return false;
    });
    const [troughAutoSortInterval, setTroughAutoSortInterval] = useState(() => {
        try {
            const savedData = localStorage.getItem('ark_trough_data');
            if (savedData) return JSON.parse(savedData).autoSortInterval || 0;
        } catch { return 0; }
        return 0;
    });

    const [isOpen, setIsOpen] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null); // Selected food state

    // Smart Features State
    const [notificationId, setNotificationId] = useState(null);
    const [isLoaded] = useState(true); // Always loaded now
    const [breakdownModal, setBreakdownModal] = useState({ isOpen: false, data: null });


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
            isAutoDuration,
            autoSortInterval: troughAutoSortInterval
        };
        localStorage.setItem('ark_trough_data', JSON.stringify(dataToSave));
    }, [creatureList, foodStacks, troughType, desiredHours, maewingWeight, maewingFood, nursingEffectiveness, maewingInputMode, maewingFoodPoints, isAutoDuration, troughAutoSortInterval, isLoaded]);

    // Auto-Duration Logic
    // Track previous state to detect transitions
    const prevAutoRef = useRef(isAutoDuration);

    useEffect(() => {
        // If transitioning from Auto (true) to Manual (false), reset hours
        if (prevAutoRef.current && !isAutoDuration) {
            setTimeout(() => setDesiredHours(0), 0);
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
            setTimeout(() => setDesiredHours(Number(hours.toFixed(2))), 0);
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
        })), foodStacks, foods, foodLists, effectiveSpoilMultiplier, simulationSettings, troughAutoSortInterval * 3600);
        return res;
    }, [creatureList, foodStacks, foods, foodLists, effectiveSpoilMultiplier, simulationSettings, creatures, troughAutoSortInterval]);

    // Check for efficiency hints
    // Efficiency calculation moved to SmartFoodRow

    // Use prop for notify toggle
    // Prop passed via `notifyEnabled` and expected to be handled by parent or delegated buttons if added.


    // Auto-select food if none selected
    useEffect(() => {
        if (availableFoods.length > 0) {
            if (!selectedFood || !availableFoods.includes(selectedFood)) {
                // Defer to avoid set-state-in-effect warning
                setTimeout(() => setSelectedFood(availableFoods[0]), 0);
            }
        } else {
            if (selectedFood) setTimeout(() => setSelectedFood(null), 0);
        }
    }, [availableFoods, selectedFood]);

    // Schedule/Cancel notification based on simulation results
    useEffect(() => {
        if (!notifyEnabled) {
            if (notificationId) {
                NotificationManager.cancel(notificationId);
                setTimeout(() => setNotificationId(null), 0);
            }
            return;
        }

    }, [results, notifyEnabled, notifyTime, t, notificationId]);

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

                    <TroughDurationInput
                        desiredHours={desiredHours}
                        onDesiredHoursChange={setDesiredHours}
                        isAutoDuration={isAutoDuration}
                        onAutoDurationChange={(checked) => {
                            setIsAutoDuration(checked);
                        }}
                    />

                    <div className={styles.inputGroup} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.9rem', color: 'rgb(var(--on-surface-variant))' }}>
                                    {t('fields.auto_sort')}
                                </span>
                                <span className={styles.tooltipIcon} title={t('tooltips.auto_sort')} style={{ marginLeft: '6px', fontSize: '12px', opacity: 0.7, cursor: 'help' }}>
                                    ⓘ
                                </span>
                            </div>
                            <select
                                value={troughAutoSortInterval}
                                onChange={(e) => setTroughAutoSortInterval(Number(e.target.value))}
                                className={styles.select}
                                style={{
                                    width: '100px',
                                    padding: '4px 8px',
                                    height: '32px'
                                }}
                            >
                                <option value={0}>{t('ui.off') || 'Off'}</option>
                                <option value={1}>1h</option>
                                <option value={12}>12h</option>
                                <option value={24}>24h</option>
                            </select>
                        </div>
                    </div>

                    {selectedFood && foods[selectedFood] && (
                        <SmartFoodRow
                            foodName={selectedFood}
                            foodData={foods[selectedFood]}
                            currentStacks={foodStacks[selectedFood]}
                            onUpdateStacks={(val) => updateFoodStacks(selectedFood, val)}
                            creatureList={creatureList}
                            creatures={creatures}
                            maxSlots={maxSlots}
                            desiredHours={desiredHours}
                            troughType={troughType}
                            effectiveSpoilMultiplier={effectiveSpoilMultiplier}
                            simulationSettings={simulationSettings}
                            foods={foods}
                            foodLists={foodLists}
                            onAutoClick={handleAutoClick}
                        />
                    )}
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
