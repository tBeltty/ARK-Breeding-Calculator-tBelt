/**
 * SessionRepository Interface
 * 
 * @interface
 */
export class SessionRepository {
    /**
     * Load all sessions
     * @returns {Promise<Session[]>}
     */
    async getAll() { throw new Error('Not implemented'); }

    /**
     * Save all sessions
     * @param {Session[]} sessions 
     * @returns {Promise<void>}
     */
    async saveAll(_sessions) { throw new Error('Method not implemented'); }

    /**
     * Get active session ID
     * @returns {Promise<string|null>}
     */
    async getActiveId() { throw new Error('Method not implemented'); }

    /**
     * Set active session ID
     * @param {string} id
     * @returns {Promise<void>}
     */
    async setActiveId(_id) { throw new Error('Method not implemented'); }
}
