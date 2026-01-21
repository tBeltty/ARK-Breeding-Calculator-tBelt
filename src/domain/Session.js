/**
 * Session Entity
 * Represents a tracking session for a creature.
 * Encapsulates state transitions and invariants.
 */
export class Session {
    constructor(id, creature, name, data = {}) {
        if (!id) throw new Error('Session ID is required');
        if (!creature) throw new Error('Creature species is required');

        this.id = id;
        this.creature = creature; // Species name (string)
        this.name = name || creature; // Nickname

        // State
        this.isPlaying = data.isPlaying || false;
        this.startTime = data.startTime || Date.now();

        // Stats
        this.weight = data.weight; // Optional, might use default from db if missing
        this.maturationPct = data.maturationPct || 0;

        // Store other data (calculator settings, etc) to preserve it
        // We exclude the fields we explicitly manage to avoid duplication/desync
        // eslint-disable-next-line no-unused-vars
        const { id: dataId, creature: dataCreature, name: dataName = null, data: nestedData = {}, maturation: _legacyMaturation, ...rest } = data;
        this.extraData = rest || {};
    }

    /**
     * Backward compatibility getter for UI which expects legacy .data structure
     */
    get data() {
        return {
            ...this.extraData,
            isPlaying: this.isPlaying,
            startTime: this.startTime,
            weight: this.weight,
            maturationPct: this.maturationPct,
            maturation: this.maturationPct // Backward compatibility alias
        };
    }

    /**
     * Start tracking
     */
    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
    }

    /**
     * Pause tracking
     */
    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
    }

    /**
     * Toggle tracking state
     */
    toggle() {
        this.isPlaying = !this.isPlaying;
    }

    /**
     * Update session data
     * @param {Object} updates Partial updates
     */
    update(updates) {
        if (updates.maturationPct !== undefined) {
            this.maturationPct = Math.min(Math.max(updates.maturationPct, 0), 100);
        }

        if (updates.weight !== undefined) {
            this.weight = updates.weight;
        }

        if (updates.name !== undefined) {
            this.name = updates.name;
        }

        if (updates.isPlaying !== undefined) {
            this.isPlaying = updates.isPlaying;
        }

        // Handle extra data updates
        for (const [key, value] of Object.entries(updates)) {
            if (!['maturationPct', 'weight', 'name', 'isPlaying', 'id', 'creature', 'maturation'].includes(key)) {
                this.extraData[key] = value;
            }
        }
    }

    /**
     * Serialize to DTO for storage/UI
     */
    toDTO() {
        return {
            id: this.id,
            creature: this.creature,
            name: this.name,
            data: {
                ...this.extraData,
                isPlaying: this.isPlaying,
                startTime: this.startTime,
                weight: this.weight,
                maturationPct: this.maturationPct
            }
        };
    }

    /**
     * Rehydrate from DTO
     */
    static fromDTO(dto) {
        return new Session(
            dto.id,
            dto.creature,
            dto.name,
            dto.data
        );
    }
}
