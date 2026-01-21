import { useState, useEffect, useCallback, useRef } from 'react';
import { CreateSession } from '../application/usecases/CreateSession';
import { UpdateSession } from '../application/usecases/UpdateSession';
import { LocalStorageSessionRepository } from '../infrastructure/LocalStorageSessionRepository';
import { Session } from '../domain/Session'; // Import Session to verify instances

// ID Generator used to be here, now inside UseCase (partially duplicated, acceptable for now)

export function useMultiDinoState(_initialGlobalSettings) {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);

    // Repository as a ref to avoid re-creation, though it has no state
    const repository = useRef(new LocalStorageSessionRepository());

    // Initial Load & Migration
    useEffect(() => {
        const repo = repository.current;
        let loadedSessions = repo.getAll();
        const activeId = repo.getActiveId();

        // FAILSAFE: Ensure all loaded items are actually Session entities.
        // If repo failed to hydrate (e.g. HMR or old class ref), force hydration here.
        if (loadedSessions && loadedSessions.length > 0) {
            loadedSessions = loadedSessions.map(s => {
                if (s instanceof Session) return s;
                // If it's a plain object (legacy/corrupt), try to hydrate it
                try {
                    if (s.data) return Session.fromDTO(s);
                    // Legacy structure fallback
                    return new Session(
                        s.id || Date.now().toString(),
                        s.creature || 'Unknown',
                        s.name,
                        { ...s.data, weight: s.data?.weight || 0, maturationPct: s.data?.maturation || 0 }
                    );
                } catch {
                    return CreateSession.execute({ initialData: 'Corrupted Session Rescue' });
                }
            });

            setSessions(loadedSessions);
            setActiveSessionId(activeId || loadedSessions[0].id);
        } else {
            // Fresh start using UseCase
            const initialSession = CreateSession.execute({
                initialData: { creature: 'Argentavis', name: 'My Dino 1' },
                existingCount: 0
            });
            setSessions([initialSession]);
            setActiveSessionId(initialSession.id);
        }
    }, []);

    // Persistence Effect
    // Optimization: Debounce this? For now, keep it simple.
    useEffect(() => {
        const repo = repository.current;
        if (sessions.length > 0) {
            // SAFE SAVE: Filter only valid entities or try to hydrate to prevent crashes
            const validSessions = sessions.map(s => {
                if (s instanceof Session) return s;
                try {
                    return s.data ? Session.fromDTO(s) : new Session(s.id, s.creature, s.name, s.data);
                } catch { return null; }
            }).filter(Boolean);

            if (validSessions.length > 0) {
                repo.saveAll(validSessions);
            }
        }
        if (activeSessionId) {
            repo.setActiveId(activeSessionId);
        }
    }, [sessions, activeSessionId]);

    // Actions
    const addSession = useCallback((initialData = {}) => {
        // Use Case handles creation logic
        const newSession = CreateSession.execute({
            initialData,
            existingCount: sessions.length
        });

        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(newSession.id);
        return newSession.id;
    }, [sessions.length]);

    const removeSession = useCallback((id) => {
        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) {
                // Ensure at least one exists
                return [CreateSession.execute({
                    initialData: { creature: 'Argentavis', name: 'My Dino' },
                    existingCount: 0
                })];
            }
            return filtered;
        });

        if (activeSessionId === id) {
            // Switch to previous or first
            setSessions(prev => {
                return prev.filter(s => s.id !== id);
            });
            // We'll trust the effect below to fix activeId if it becomes invalid? 
            // Better to handle it explicitly.
            setActiveSessionId(prevId => {
                if (prevId === id) {
                    // We can't see the 'new' sessions here easily.
                    // Simplified: Just clear it and let a comprehensive effect pick the first one?
                    return null;
                }
                return prevId;
            });
        }
    }, [activeSessionId]);

    // Fix active ID if null
    // Ensure active session ID is valid, but avoid setting it during render if possible
    useEffect(() => {
        if (!activeSessionId && sessions.length > 0) {
            // Defer update to next tick to avoid warning, or accept it as initialization
            setTimeout(() => setActiveSessionId(sessions[0].id), 0);
        }
    }, [activeSessionId, sessions, setActiveSessionId]);

    const updateSession = useCallback((id, updates) => {
        setSessions(prev => prev.map(s => {
            if (s.id !== id) return s;

            // ZOMBIE PROTECTION: If 's' is a plain object due to HMR/Legacy state, hydrate it now.
            let entity = s;
            if (!(s instanceof Session)) {
                try {
                    entity = s.data ? Session.fromDTO(s) : new Session(s.id, s.creature, s.name, s.data || {});
                } catch {
                    return s; // Can't update if we can't hydrate
                }
            }

            return UpdateSession.execute(entity, updates);
        }));
    }, []);

    const updateActiveSession = useCallback((updates) => {
        if (!activeSessionId) return;
        // Delegate to generic
        updateSession(activeSessionId, updates);
    }, [activeSessionId, updateSession]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    return {
        sessions,
        activeSessionId,
        activeSession,
        addSession,
        removeSession,
        switchSession: setActiveSessionId,
        updateSession,
        updateActiveSession,
        setSessions
    };
}
