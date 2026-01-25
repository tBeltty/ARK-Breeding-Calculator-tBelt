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
        this.isPlaying = data.isPlaying || false;
        this.startTime = data.startTime || Date.now();
        this.totalMaturationSeconds = data.totalMaturationSeconds || 3600; // Default 1h if missing
        this.offlineSeconds = data.offlineSeconds || 0;

        // Stats
        this.weight = data.weight;
        this.trackedServerId = data.trackedServerId;
        this.lastServerStatus = data.lastServerStatus;
        this.maturationAtStart = data.maturationAtStart !== undefined ? data.maturationAtStart : (data.maturationPct || data.maturation || 0);


        // Ensure maturationAtStart is decimal (0-1) if it was stored as 0-100
        if (this.maturationAtStart > 1) this.maturationAtStart /= 100;

        // Store other data (calculator settings, etc) to preserve it
        const { id: _id, creature: _creature, name: _name = null, data: _nestedData = {}, maturation: _legacyMaturation, ...rest } = data;
        this.extraData = rest || {};
    }

    /**
     * Get current maturation percentage based on time
     */
    get maturationPct() {
        if (!this.isPlaying) return this.maturationAtStart;

        const effectiveElapsed = ((Date.now() - this.startTime) / 1000) - (this.offlineSeconds || 0);
        // Safety check for totalMaturationSeconds to avoid division by zero
        if (!this.totalMaturationSeconds || this.totalMaturationSeconds === 0) return this.maturationAtStart;

        const additionalProgress = Math.max(0, effectiveElapsed / this.totalMaturationSeconds);
        const result = Math.min(Math.max(this.maturationAtStart + additionalProgress, 0), 1);

        return isNaN(result) ? 0 : result;
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
            maturation: this.maturationPct,
            totalMaturationSeconds: this.totalMaturationSeconds,
            maturationAtStart: this.maturationAtStart
        };
    }

    /**
     * Perform a "Soft Reset" to lock in current progress as the new starting point.
     * Useful when rates change or manual adjustments are made.
     */
    softReset() {
        this.maturationAtStart = this.maturationPct;
        this.startTime = Date.now();
    }

    /**
     * Calculate what the maturation percentage SHOULD be, considering a rate change
     * that happened in the past.
     * 
     * @param {number} transitionTime - Timestamp (ms) when the rates changed
     * @param {number} oldTotalTime - Maturation time (seconds) with the OLD rates
     * @param {number} newTotalTime - Maturation time (seconds) with the NEW rates
     * @returns {number} The corrected maturation percentage (0-1)
     */
    calculateRetroactiveProgress(transitionTime, oldTotalTime, newTotalTime) {
        if (!this.isPlaying) return this.maturationAtStart;

        const now = Date.now();
        const start = this.startTime;

        // 1. Time spent under old rates (from start to change)
        const timeOldRates = Math.max(0, (Math.min(now, transitionTime) - start) / 1000);
        const progressOld = timeOldRates / oldTotalTime;

        // 2. Time spent under new rates (from change to now)
        const timeNewRates = Math.max(0, (now - Math.max(start, transitionTime)) / 1000);
        const progressNew = timeNewRates / newTotalTime;

        return Math.min(Math.max(this.maturationAtStart + progressOld + progressNew, 0), 1);
    }

    /**
     * Start tracking
     */
    start() {
        if (this.isPlaying) return;
        this.startTime = Date.now();
        this.isPlaying = true;
    }

    /**
     * Pause tracking
     */
    pause() {
        if (!this.isPlaying) return;
        this.maturationAtStart = this.maturationPct;
        this.isPlaying = false;
    }

    /**
     * Toggle tracking state
     */
    toggle() {
        if (this.isPlaying) this.pause();
        else this.start();
    }

    /**
     * Update session data
     * @param {Object} updates Partial updates
     */
    update(updates) {
        // Helper to extract value from nested or flat updates
        const getVal = (key) => {
            if (updates[key] !== undefined) return updates[key];
            if (updates.data && updates.data[key] !== undefined) return updates.data[key];
            return undefined;
        };

        const matPct = getVal('maturationPct') ?? getVal('maturation');
        if (matPct !== undefined) {
            // Ensure we store as decimal
            const val = matPct > 1 ? matPct / 100 : matPct;
            this.maturationAtStart = Math.min(Math.max(val, 0), 1);
            // If playing, we must reset start time to prevent "jumping"
            if (this.isPlaying) this.startTime = Date.now();
        }

        const totalTime = getVal('totalMaturationSeconds');
        if (totalTime !== undefined) {
            this.totalMaturationSeconds = totalTime;
        }

        const offlineSecs = getVal('offlineSeconds');
        if (offlineSecs !== undefined) {
            this.offlineSeconds = offlineSecs;
        }

        if (updates.trackedServerId !== undefined) {
            this.trackedServerId = updates.trackedServerId;
        }

        if (updates.lastServerStatus !== undefined) {
            this.lastServerStatus = updates.lastServerStatus;
        }

        if (updates.weight !== undefined) {
            this.weight = updates.weight;
        }


        if (updates.name !== undefined) {
            this.name = updates.name;
        }

        if (updates.isPlaying !== undefined) {
            if (updates.isPlaying) this.start();
            else this.pause();
        }

        // Handle extra data updates
        for (const [key, value] of Object.entries(updates)) {
            if (!['maturationPct', 'weight', 'name', 'isPlaying', 'id', 'creature', 'maturation', 'totalMaturationSeconds', 'maturationAtStart'].includes(key)) {
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
                maturationAtStart: this.maturationAtStart,
                totalMaturationSeconds: this.totalMaturationSeconds,
                offlineSeconds: this.offlineSeconds,
                trackedServerId: this.trackedServerId,
                lastServerStatus: this.lastServerStatus
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

    /**
     * Create a shallow copy of the session to force React updates
     */
    clone() {
        return new Session(this.id, this.creature, this.name, this.data);
    }
}
