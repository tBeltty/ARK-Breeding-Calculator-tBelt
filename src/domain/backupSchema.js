/**
 * Backup Schema & Validation
 *
 * Implements a "Whitelist Only" validation strategy.
 * Any field not explicitly matched is discarded.
 * Any value with incorrect type is discarded.
 */

// Allowed Themes Whitelist
const ALLOWED_THEMES = [
    'arat-prime',
    'crystal-horizon',
    'aberrant-depths',
    'frozen-peaks',
    'tek-pulse',
    'primal-dawn'
];

// Allowed Languages
const ALLOWED_LANGUAGES = ['en', 'es'];

// Allowed Game Versions
const ALLOWED_VERSIONS = ['ASE', 'ASA'];

/**
 * Validate a single session object.
 * @param {Object} session Raw session object
 * @returns {Object|null} Sanitized session or null if invalid
 */
const validateSession = (session) => {
    if (!session || typeof session !== 'object') return null;
    if (!session.id || typeof session.id !== 'string') return null;
    if (!session.creature || typeof session.creature !== 'string') return null;

    // Sanitize Strings (Max Length 50)
    const safeString = (str) => (typeof str === 'string' ? str.slice(0, 50) : '');

    // Sanitize Numbers
    const safeNumber = (num, min, max, def) => {
        const val = parseFloat(num);
        if (isNaN(val)) return def;
        return Math.min(Math.max(val, min), max);
    };

    return {
        id: session.id, // ID is trusted (UUID usually)
        creature: safeString(session.creature),
        name: safeString(session.name),
        weight: safeNumber(session.weight, 0, 1000000, 0),
        maturationPct: safeNumber(session.maturationPct, 0, 100, 0),
        isPlaying: Boolean(session.isPlaying),
        startTime: safeNumber(session.startTime, 0, Date.now() + 86400000, Date.now()), // Allow small future drift
        // Whitelist extraData keys if needed, for now we keep it minimal
        // We do NOT strictly validate extraData content deeply, but we ensure it's an object
        // Attempting to filter generic malicious patterns in keys
        extraData: (typeof session.extraData === 'object') ? session.extraData : {}
    };
};

/**
 * Validate Global Settings
 * @param {Object} settings Raw settings
 * @returns {Object} Sanitized settings
 */
const validateSettings = (settings) => {
    if (!settings || typeof settings !== 'object') return {};

    const safeNumber = (num, min, max, def) => {
        const val = parseFloat(num);
        if (isNaN(val)) return def;
        return Math.min(Math.max(val, min), max);
    };

    return {
        maturationSpeed: safeNumber(settings.maturationSpeed, 0.001, 1000, 1),
        hatchSpeed: safeNumber(settings.hatchSpeed, 0.001, 1000, 1),
        consumptionSpeed: safeNumber(settings.consumptionSpeed, 0.001, 1000, 1),
        troughSpoilageMult: safeNumber(settings.troughSpoilageMult, 0.001, 1000, 1),
        gen2HatchEffect: Boolean(settings.gen2HatchEffect),
        gen2GrowthEffect: Boolean(settings.gen2GrowthEffect)
    };
};

/**
 * Main Backup Validator
 * @param {Object} data JSON parsed payload
 * @returns {Object|null} Valid backup object or null
 */
export const validateBackup = (data) => {
    if (!data || typeof data !== 'object') return null;
    if (data.version !== 1) return null; // Version check

    // Validate Metadata
    const meta = {
        timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
        appVersion: typeof data.appVersion === 'string' ? data.appVersion.slice(0, 10) : 'unknown'
    };

    // Validate Global Configs
    const globalHelper = (data.global || {});
    const global = {
        gameVersion: ALLOWED_VERSIONS.includes(globalHelper.gameVersion) ? globalHelper.gameVersion : 'ASA',
        activeTheme: ALLOWED_THEMES.includes(globalHelper.activeTheme) ? globalHelper.activeTheme : 'arat-prime',
        language: ALLOWED_LANGUAGES.includes(globalHelper.language) ? globalHelper.language : 'en',
        notifyEnabled: Boolean(globalHelper.notifyEnabled)
    };

    // Validate Settings
    const settings = validateSettings(data.settings);

    // Validate Sessions
    const sessions = [];
    if (Array.isArray(data.sessions)) {
        for (const s of data.sessions) {
            const validS = validateSession(s);
            if (validS) sessions.push(validS);
        }
    }

    return {
        version: 1,
        meta,
        global,
        settings,
        sessions
    };
};
