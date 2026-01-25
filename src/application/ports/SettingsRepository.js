/**
 * Settings Repository Port (Interface)
 * Defines the contract for persisting user settings.
 * Following Clean Architecture: Application layer defines the port,
 * Infrastructure layer provides the implementation.
 */

/**
 * @typedef {Object} BreedingSettings
 * @property {number} consumptionSpeed - Food consumption multiplier
 * @property {number} maturationSpeed - Maturation speed multiplier
 * @property {number} hatchSpeed - Hatch/gestation speed multiplier
 * @property {number} baseMinfoodRate - Base minimum food rate
 * @property {number} lossFactor - Food loss percentage
 * @property {boolean} gen2HatchEffect - Gen2 faster hatching
 * @property {boolean} gen2GrowthEffect - Gen2 faster growth
 */

/**
 * Settings Repository Interface
 * Any implementation must provide these methods.
 */
export const SettingsRepository = {
    /**
     * Load settings from storage.
     * @returns {BreedingSettings} The saved settings or defaults
     */
    load: () => { throw new Error('Not implemented'); },

    /**
     * Save settings to storage.
     * @param {BreedingSettings} settings - Settings to persist
     * @returns {void}
     */
    save: (_settings) => { throw new Error('Not implemented'); },

    /**
     * Clear all saved settings.
     * @returns {void}
     */
    clear: () => { throw new Error('Not implemented'); }
};

export default SettingsRepository;
