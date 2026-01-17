import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TroughCalculator.module.css';
import { DataPanel, DataRow, DataInput, LabelWithTooltip } from '../DataPanel';
import { simulateTrough, TROUGH_TYPES } from '../../domain/trough';
import { formatTime } from '../../domain/breeding';

/**
 * TroughCalculator Component
 * Simulates how long food in a trough will last for multiple creatures.
 * 
 * Props:
 * - creatures: Object - All creature data
 * - foods: Object - All food data
 * - foodLists: Object - Food type mappings
 * - settings: Object - Server settings
 * - currentCreature: string - Currently selected creature name
 * - currentMaturation: number - Current creature's maturation progress
 */
export function TroughCalculator({ creatures, foods, foodLists, settings, currentCreature, currentMaturation }) {
    const { t } = useTranslation();
    const [creatureList, setCreatureList] = useState([]);
    const [foodStacks, setFoodStacks] = useState({});
    const [troughType, setTroughType] = useState('Normal');
    const [isOpen, setIsOpen] = useState(false);

    // Get available food types based on creatures in list
    const availableFoods = useMemo(() => {
        const foodSet = new Set();
        for (const entry of creatureList) {
            const creature = creatures[entry.name];
            if (creature) {
                const creatureFoods = foodLists[creature.type] || [];
                creatureFoods.forEach(f => foodSet.add(f));
            }
        }
        return Array.from(foodSet);
    }, [creatureList, creatures, foodLists]);

    // Run simulation
    const results = useMemo(() => {
        if (creatureList.length === 0) return null;

        const enrichedList = creatureList.map(entry => ({
            ...entry,
            creatureData: creatures[entry.name]
        })).filter(entry => entry.creatureData);

        return simulateTrough(
            enrichedList,
            foodStacks,
            foods,
            foodLists,
            TROUGH_TYPES[troughType] || 1,
            settings
        );
    }, [creatureList, foodStacks, troughType, creatures, foods, foodLists, settings]);

    const addCurrentCreature = () => {
        if (!currentCreature || !creatures[currentCreature]) return;

        setCreatureList(prev => [...prev, {
            name: currentCreature,
            maturation: currentMaturation,
            quantity: 1
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
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <LabelWithTooltip
                        label={t('ui.creatures_in_trough')}
                        tooltip={t('tooltips.creatures_in_trough')}
                    />
                    <button
                        className={styles.addButton}
                        onClick={addCurrentCreature}
                        title={t('tooltips.add_current_creature')}
                    >
                        {t('ui.add_current')}
                    </button>
                </div>

                {creatureList.length === 0 ? (
                    <p className={styles.hint}>{t('ui.trough_hint')}</p>
                ) : (
                    <ul className={styles.creatureList}>
                        {creatureList.map((entry, index) => (
                            <li key={index} className={styles.creatureItem}>
                                <span className={styles.creatureName}>{entry.name}</span>
                                <span className={styles.creatureInfo}>
                                    {Math.round(entry.maturation * 100)}%
                                </span>
                                <input
                                    type="number"
                                    className={styles.quantityInput}
                                    value={entry.quantity}
                                    onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={100}
                                    title={t('tooltips.quantity')}
                                />
                                <button
                                    className={styles.removeButton}
                                    onClick={() => removeCreature(index)}
                                    title={t('tooltips.remove_creature')}
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <LabelWithTooltip
                        label={t('ui.trough_type')}
                        tooltip={t('tooltips.trough_type')}
                    />
                    <select
                        className={styles.select}
                        value={troughType}
                        onChange={(e) => setTroughType(e.target.value)}
                        title={t('tooltips.trough_type')}
                    >
                        {Object.keys(TROUGH_TYPES).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            {availableFoods.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <LabelWithTooltip
                            label={t('ui.food_stacks')}
                            tooltip={t('tooltips.food_stacks')}
                        />
                    </div>
                    {availableFoods.map(foodName => (
                        <div key={foodName} className={styles.foodRow}>
                            <span className={styles.foodName}>{foodName}</span>
                            <input
                                type="number"
                                className={styles.stackInput}
                                value={foodStacks[foodName] || 0}
                                onChange={(e) => updateFoodStacks(foodName, parseFloat(e.target.value) || 0)}
                                min={0}
                                step={0.5}
                                placeholder="0"
                                title={t('tooltips.food_stack')}
                            />
                            <span className={styles.stackLabel}>{t('ui.stacks')}</span>
                        </div>
                    ))}
                </div>
            )}

            {results && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span>{t('ui.results')}</span>
                    </div>
                    <DataRow
                        label={t('fields.trough_duration')}
                        tooltip={t('tooltips.trough_duration')}
                        value={formatTime(results.time)}
                    />
                    <DataRow
                        label={t('fields.food_eaten')}
                        tooltip={t('tooltips.food_eaten')}
                        value={results.eatenFood.toLocaleString()}
                    />
                    <DataRow
                        label={t('fields.food_spoiled')}
                        tooltip={t('tooltips.food_spoiled')}
                        value={results.spoiledFood.toLocaleString()}
                    />
                    <DataRow
                        label={t('fields.efficiency')}
                        tooltip={t('tooltips.efficiency')}
                        value={results.totalFood > 0
                            ? `${Math.round(results.eatenFood / results.totalFood * 100)}%`
                            : '0%'}
                    />
                </div>
            )}
        </DataPanel>
    );
}

export default TroughCalculator;
