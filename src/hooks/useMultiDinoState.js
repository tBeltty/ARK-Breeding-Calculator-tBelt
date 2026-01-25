import { useState, useEffect, useCallback, useRef } from 'react';
import { CreateSession } from '../application/usecases/CreateSession';
import { UpdateSession } from '../application/usecases/UpdateSession';
import { LocalStorageSessionRepository } from '../infrastructure/LocalStorageSessionRepository';
import { DebouncedSessionRepository } from '../infrastructure/DebouncedSessionRepository';
import { Session } from '../domain/Session'; // Import Session to verify instances

// ID Generator used to be here, now inside UseCase (partially duplicated, acceptable for now)

export function useMultiDinoState(_initialGlobalSettings) {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);

    // Ghost Session State (Transient, not saved to repo)
    const [ghostSession, setGhostSession] = useState(null);

    // Repository as a ref to avoid re-creation
    // Wrap LocalStorage in Debounced to prevent spamming writes on every tick
    const repository = useRef(new DebouncedSessionRepository(new LocalStorageSessionRepository(), 500));
    const [isInitialized, setIsInitialized] = useState(false);

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
                        { ...s.data, weight: s.data?.weight || 0, maturationAtStart: (s.data?.maturationPct || s.data?.maturation || 0) > 1 ? (s.data?.maturationPct || s.data?.maturation || 0) / 100 : (s.data?.maturationPct || s.data?.maturation || 0) }
                    );
                } catch {
                    return CreateSession.execute({ initialData: 'Corrupted Session Rescue' });
                }
            });

            setSessions(loadedSessions);
            setActiveSessionId(activeId || loadedSessions[0].id);
            console.log(`[Persistence] Initial load: ${loadedSessions.length} sessions. Active: ${activeId}`);
        } else {
            console.log('[Persistence] Initial load: No sessions found.');
            setSessions([]);
            setActiveSessionId(null);
        }
        setIsInitialized(true);
    }, []);

    // Persistence Effect
    useEffect(() => {
        if (!isInitialized) {
            console.log('[Persistence] Save blocked: Not initialized.');
            return;
        }

        const repo = repository.current;
        if (sessions) {
            // console.log(`[Persistence] Saving ${sessions.length} sessions...`);
            const validSessions = sessions.map(s => {
                if (s instanceof Session) return s;
                try {
                    return s.data ? Session.fromDTO(s) : new Session(s.id, s.creature, s.name, s.data);
                } catch { return null; }
            }).filter(Boolean);

            repo.saveAll(validSessions);
        }

        // Only persist active ID if it's NOT a ghost session
        if (activeSessionId && activeSessionId !== 'ghost') {
            repo.setActiveId(activeSessionId);
        } else {
            // Keep previous ID in repo? Or null? 
            // If ghost, we arguably shouldn't touch the saved active ID 
            // so reloading the page brings back the last REAL session.
            // But checking 'ghost' implies we need to handle that check on load.
            // For now, let's just not update it.
            if (activeSessionId !== 'ghost') {
                repo.setActiveId(null);
            }
        }
    }, [sessions, activeSessionId, isInitialized]);

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

    // Create a Ghost Session (Transient)
    const createGhostSession = useCallback((initialData = {}) => {
        const ghost = CreateSession.execute({
            initialData,
            existingCount: 0 // Doesn't matter for ghost
        });
        // Override ID to ensure we know it's ghost logic internally if needed, 
        // OR just keep it separate and use activeSessionId='ghost'
        // We will keep the session object as is, but store it in ghostSession state.
        setGhostSession(ghost);
        setActiveSessionId('ghost');
        return ghost;
    }, []);

    // Promote Ghost to Real
    const promoteGhostSession = useCallback(() => {
        if (!ghostSession) return null;

        // It's already a valid session object, just move it to the list.
        // Maybe generate a new ID to be safe against collisions if we recycled logic?
        // CreateSession generates unique timestamp IDs, so it should be fine.

        setSessions(prev => [...prev, ghostSession]);
        setActiveSessionId(ghostSession.id);
        setGhostSession(null);
        return ghostSession.id;
    }, [ghostSession]);

    const removeSession = useCallback((idToRemove) => {
        // Calculate new sessions list based on current state
        const filtered = sessions.filter(s => s.id !== idToRemove);
        setSessions(filtered);

        // Update active ID if we removed the currently active one
        if (activeSessionId === idToRemove) {
            const nextId = filtered.length > 0 ? filtered[0].id : null;
            setActiveSessionId(nextId);
        }
    }, [sessions, activeSessionId]);

    // Fix active ID if null
    // Ensure active session ID is valid, but avoid setting it during render if possible
    useEffect(() => {
        if (!activeSessionId && sessions.length > 0) {
            // Defer update to next tick to avoid warning, or accept it as initialization
            setTimeout(() => setActiveSessionId(sessions[0].id), 0);
        }
    }, [activeSessionId, sessions, setActiveSessionId]);

    const updateSession = useCallback((id, updates) => {
        // Handle Ghost Update
        if (id === 'ghost' || (activeSessionId === 'ghost' && (!id || id === ghostSession?.id))) {
            setGhostSession(prev => {
                if (!prev) return null;
                return UpdateSession.execute(prev, updates);
            });
            return;
        }

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
    }, [activeSessionId, ghostSession?.id]);

    const updateActiveSession = useCallback((updates) => {
        if (activeSessionId === 'ghost') {
            updateSession('ghost', updates);
        } else if (activeSessionId) {
            updateSession(activeSessionId, updates);
        }
    }, [activeSessionId, updateSession]);

    const activeSession = activeSessionId === 'ghost' ? ghostSession : (sessions.find(s => s.id === activeSessionId) || sessions[0]);

    return {
        sessions,
        activeSessionId,
        activeSession,
        addSession,
        removeSession,
        switchSession: setActiveSessionId,
        updateSession,
        updateActiveSession,
        setSessions,
        createGhostSession,
        promoteGhostSession,
        isGhostMode: activeSessionId === 'ghost'
    };
}
