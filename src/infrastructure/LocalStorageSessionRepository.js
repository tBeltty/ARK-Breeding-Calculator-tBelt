import { SessionRepository } from '../application/ports/SessionRepository';
import { Session } from '../domain/Session';

const STORAGE_KEY_SESSIONS = 'arktic_sessions_v1';
const STORAGE_KEY_ACTIVE = 'arktic_active_id_v1';

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
                // Ensure legacy 'maturation' field is mapped to maturationAtStart for new constructor
                if (dto.data.maturation !== undefined && dto.data.maturationAtStart === undefined) {
                    dto.data.maturationAtStart = dto.data.maturation * 100; // Convert 0-1 to 0-100
                }
                if (dto.data.maturationPct !== undefined && dto.data.maturationAtStart === undefined) {
                    dto.data.maturationAtStart = dto.data.maturationPct;
                }
                return Session.fromDTO(dto);
            }
            // Minimal migration wrapper for very old data
            return new Session(
                dto.id || Date.now().toString(),
                dto.creature || 'Unknown',
                dto.name,
                {
                    ...dto.data,
                    weight: dto.data?.weight || 0,
                    maturationAtStart: (dto.data?.maturationPct || dto.data?.maturation || 0) * 100
                }
            );
        } catch (e) {
            console.error('Hydration failed', e);
            // Last resort fallback
            return new Session(Date.now().toString(), 'ErrorDino', 'Error');
        }
    }
}
