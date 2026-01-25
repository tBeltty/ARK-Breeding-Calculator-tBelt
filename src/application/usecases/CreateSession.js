import { Session } from '../../domain/Session';

export class CreateSession {
    /**
     * Execute creation of a new session
     * @param {Object} request Input data
     * @param {string|Object} request.initialData name or object with settings
     * @param {number} request.existingCount Number of existing sessions (for naming)
     * @returns {Session} New Session entity
     */
    static execute({ initialData = {}, existingCount = 0 }) {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const isString = typeof initialData === 'string';

        const creature = isString ? initialData : (initialData.creature || 'Argentavis');

        // Naming logic
        const name = isString
            ? `${initialData} ${existingCount + 1}`
            : (initialData.name || `${creature} ${existingCount + 1}`);

        // Data extraction
        const sessionData = isString ? {} : {
            weight: initialData.weight || 0,
            maturationAtStart: initialData.maturationPct || initialData.maturation || 0,
            totalMaturationSeconds: initialData.totalMaturationSeconds || 3600,
            isPlaying: initialData.isPlaying || false,
            autoSortInterval: 0, // Default: Off
            // Preserve other potential fields from initialData if passed via object
            ...initialData
        };

        // Clean up data that shouldn't be effectively double-stored if passed in spread
        delete sessionData.creature;
        delete sessionData.name;

        return new Session(id, creature, name, sessionData);
    }
}
