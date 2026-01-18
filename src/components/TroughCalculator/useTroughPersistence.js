import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ark_trough_data';

const DEFAULT_STATE = {
    creatureList: [],
    foodStacks: {},
    troughType: 'Normal',
    desiredHours: 0,
    maewingWeight: 1000,
    maewingFood: 2000,
    nursingEffectiveness: 100,
    maewingInputMode: 'basic',
    maewingFoodPoints: 30,
    isAutoDuration: false
};

/**
 * Custom hook to manage TroughCalculator state persistence to LocalStorage.
 * Encapsulates load/save logic.
 */
export function useTroughPersistence() {
    const [state, setState] = useState(DEFAULT_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setState({
                    creatureList: Array.isArray(parsed.creatureList) ? parsed.creatureList : [],
                    foodStacks: parsed.foodStacks || {},
                    troughType: parsed.troughType || 'Normal',
                    desiredHours: parsed.desiredHours || 0,
                    maewingWeight: parsed.maewingWeight || 1000,
                    maewingFood: parsed.maewingFood || 2000,
                    nursingEffectiveness: parsed.nursingEffectiveness || 100,
                    maewingInputMode: parsed.maewingInputMode || 'basic',
                    maewingFoodPoints: parsed.maewingFoodPoints || 30,
                    isAutoDuration: parsed.isAutoDuration || false
                });
            } catch (e) {
                console.error('Failed to load trough data', e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage when state changes
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state, isLoaded]);

    // Partial state updater
    const updateState = (updates) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    return {
        ...state,
        isLoaded,
        updateState,
        // Individual setters for convenience
        setCreatureList: (val) => updateState({ creatureList: val }),
        setFoodStacks: (val) => updateState({ foodStacks: val }),
        setTroughType: (val) => updateState({ troughType: val }),
        setDesiredHours: (val) => updateState({ desiredHours: val }),
        setIsAutoDuration: (val) => updateState({ isAutoDuration: val }),
        setMaewingConfig: (config) => updateState({
            maewingWeight: config.weight,
            maewingFood: config.food,
            maewingFoodPoints: config.foodPoints,
            nursingEffectiveness: config.nursingEffectiveness,
            maewingInputMode: config.inputMode
        })
    };
}
