/**
 * LocalStorage Settings Repository
 * Infrastructure adapter implementing the SettingsRepository port.
 * 
 * Following Clean Architecture:
 * - Implements Application port
 * - Contains no business logic
 * - Handles all localStorage specifics
 */

import { DEFAULT_SETTINGS } from '../domain/breeding';

const SETTINGS_KEY = 'ark-breeding-calculator-settings';
const SESSION_KEY = 'ark-breeding-calculator-session';

/**
 * Default session state
 */
const DEFAULT_SESSION = {
    selectedCreature: 'Argentavis',
    weight: 400,
    maturationProgress: 0,
    selectedFood: 'Raw Meat',
    gameVersion: 'ASA',
    theme: 'arat-prime',
    language: 'en'
};

/**
 * Load settings from localStorage.
 * @returns {Object} Settings merged with defaults
 */
/**
 * Validate settings object to prevent corruption/logic bombs.
 * @param {Object} data - Raw data from storage
 * @returns {Object} Validated settings
 */
function validateSettings(data) {
    if (!data || typeof data !== 'object') return { ...DEFAULT_SETTINGS };

    const safeNumber = (val, def, min, max) => {
        const num = parseFloat(val);
        if (isNaN(num)) return def;
        if (min !== undefined && num < min) return min;
        if (max !== undefined && num > max) return max;
        return num;
    };

    return {
        ...DEFAULT_SETTINGS,
        maturationSpeed: safeNumber(data.maturationSpeed, DEFAULT_SETTINGS.maturationSpeed, 0.001, 1000),
        hatchSpeed: safeNumber(data.hatchSpeed, DEFAULT_SETTINGS.hatchSpeed, 0.001, 1000),
        consumptionSpeed: safeNumber(data.consumptionSpeed, DEFAULT_SETTINGS.consumptionSpeed, 0.001, 1000),
        // Booleans
        gen2HatchEffect: typeof data.gen2HatchEffect === 'boolean' ? data.gen2HatchEffect : DEFAULT_SETTINGS.gen2HatchEffect,
        gen2GrowthEffect: typeof data.gen2GrowthEffect === 'boolean' ? data.gen2GrowthEffect : DEFAULT_SETTINGS.gen2GrowthEffect
    };
}

/**
 * Load settings from localStorage.
 * @returns {Object} Settings merged with defaults
 */
export function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return validateSettings(parsed);
        }
    } catch (error) {
        console.warn('Failed to load settings from localStorage:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage.
 * @param {Object} settings - Settings to persist
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
    }
}

/**
 * Load session state from localStorage.
 * @returns {Object} Session state merged with defaults
 */
export function loadSession() {
    try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_SESSION, ...parsed };
        }
    } catch (error) {
        console.warn('Failed to load session from localStorage:', error);
    }
    return { ...DEFAULT_SESSION };
}

/**
 * Save session state to localStorage.
 * @param {Object} session - Session state to persist
 */
export function saveSession(session) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.warn('Failed to save session to localStorage:', error);
    }
}

/**
 * Clear all saved data.
 */
export function clearAll() {
    try {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.warn('Failed to clear localStorage:', error);
    }
}

/**
 * LocalStorageSettingsRepository - Implements SettingsRepository port
 */
export const LocalStorageSettingsRepository = {
    loadSettings,
    saveSettings,
    loadSession,
    saveSession,
    clearAll
};

export default LocalStorageSettingsRepository;

