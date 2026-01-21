import { SessionRepository } from '../application/ports/SessionRepository';
import { Session } from '../domain/Session';

const STORAGE_KEY_SESSIONS = 'ark_breeding_sessions';
const STORAGE_KEY_ACTIVE = 'ark_breeding_active_id';

export class LocalStorageSessionRepository extends SessionRepository {
    getAll() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            const rawData = parsed.data || parsed; // Handle potential old wrappers

            return (Array.isArray(rawData) ? rawData : [])
                .map(dto => this._hydrate(dto));
        } catch (e) {
            console.error('Repo load failed', e);
            return [];
        }
    }

    saveAll(sessions) {
        try {
            const dtos = sessions.map(s => s.toDTO());
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(dtos));
        } catch (e) {
            console.error('Repo save failed', e);
        }
    }

    getActiveId() {
        return localStorage.getItem(STORAGE_KEY_ACTIVE);
    }

    setActiveId(id) {
        if (id) {
            localStorage.setItem(STORAGE_KEY_ACTIVE, id);
        } else {
            localStorage.removeItem(STORAGE_KEY_ACTIVE);
        }
    }

    _hydrate(dto) {
        // Fallback for raw objects if not fully migrated
        try {
            if (dto.data) {
                return Session.fromDTO(dto);
            }
            // Minimal migration wrapper
            return new Session(
                dto.id || Date.now().toString(),
                dto.creature || 'Unknown',
                dto.name,
                { ...dto.data, weight: dto.data?.weight || 0, maturationPct: dto.data?.maturation || 0 }
            );
        } catch {
            // Last resort fallback
            return new Session(Date.now().toString(), 'ErrorDino', 'Error');
        }
    }
}
