
import { SessionRepository } from '../application/ports/SessionRepository';

export class DebouncedSessionRepository extends SessionRepository {
    constructor(innerRepo, delay = 1000) {
        super();
        this.inner = innerRepo;
        this.delay = delay;
        this.timeout = null;
        this.pendingData = null;
    }

    getAll() {
        return this.inner.getAll();
    }

    getActiveId() {
        return this.inner.getActiveId();
    }

    setActiveId(id) {
        this.inner.setActiveId(id);
    }

    saveAll(sessions) {
        // Debounce write
        this.pendingData = sessions;
        if (this.timeout) {
            return; // Already scheduled
        }

        this.timeout = setTimeout(() => {
            this.flush();
        }, this.delay);
    }

    flush() {
        if (this.pendingData) {
            this.inner.saveAll(this.pendingData);
            this.pendingData = null;
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}
