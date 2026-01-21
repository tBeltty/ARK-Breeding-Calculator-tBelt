import { Session } from '../../domain/Session';

export class UpdateSession {
    /**
     * Execute update on a session
     * @param {Session} session Current session entity
     * @param {Object|Function} updates Updates to apply
     * @returns {Session} New session entity with updates applied
     */
    static execute(session, updates) {
        // Clone via DTO to ensure immutability
        const dto = session.toDTO();
        const newSession = Session.fromDTO(dto);

        // Resolve function updates
        const updateValues = typeof updates === 'function' ? updates(session) : updates;

        // Flatten legacy data structure if present
        const flatUpdates = { ...updateValues };

        if (updateValues.data) {
            // Map known data keys to entity properties
            if (updateValues.data.weight !== undefined) flatUpdates.weight = updateValues.data.weight;
            if (updateValues.data.maturationPct !== undefined) flatUpdates.maturationPct = updateValues.data.maturationPct;
            if (updateValues.data.maturation !== undefined) flatUpdates.maturationPct = updateValues.data.maturation;
            if (updateValues.data.isPlaying !== undefined) flatUpdates.isPlaying = updateValues.data.isPlaying;

            // Any other properties in 'data' will be handled by Session.update() logic 
            // which puts unknown keys into extraData

            // We should also merge the rest of 'data' into flatUpdates so Session.update picks them up
            const { weight: _weight, maturationPct: _maturationPct, maturation: _maturation, isPlaying: _isPlaying, ...others } = updateValues.data;
            Object.assign(flatUpdates, others);
        }

        newSession.update(flatUpdates);
        return newSession;
    }
}
