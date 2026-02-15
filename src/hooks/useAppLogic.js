import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMultiDinoState } from './useMultiDinoState';
import { CreateSession } from '../application/usecases/CreateSession';
import { UpdateSession } from '../application/usecases/UpdateSession';
import { calculateMaturationTime } from '../domain/breeding';
import creatures from '../data/creatures.json';

// Composed Hooks
import { useTheme } from './useTheme';
import { useSettings } from './useSettings';
import { useNotification } from './useNotification';
import { useAutoRates } from './useAutoRates';
import { useServerTracking } from './useServerTracking';

const MAX_ACTIVE_TRACKING = 20;

export function useAppLogic(addToast) {
    const { t } = useTranslation();

    // 1. Theme & UI State
    const {
        gameVersion,
        setGameVersion,
        activeTheme,
        setActiveTheme,
        language,
        setLanguage
    } = useTheme();

    // 2. Global Settings
    const {
        settings,
        setSettings,
        updateGlobalSetting: updateSettingInternal
    } = useSettings();

    // 3. Notifications
    const {
        notifyEnabled,
        setNotifyEnabled,
        notifyTime,
        setNotifyTime,
        handleNotifyToggle
    } = useNotification(addToast);

    // 4. Session State (Multi-Dino)
    const {
        sessions,
        activeSessionId,
        activeSession,
        addSession,
        removeSession,
        switchSession,
        updateActiveSession,
        updateSession,
        setSessions,
        createGhostSession,
        promoteGhostSession,
        isGhostMode
    } = useMultiDinoState();

    // 5. Server Tracking
    const {
        trackedServers,
        fetchTrackedServers
        // syncServerDowntime is handled internally by the hook
    } = useServerTracking(sessions, updateSession, addToast);

    // 6. Auto-Rates
    useAutoRates(settings, setSettings, setSessions, addToast);

    // 7. Local UI State (Modals)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // 8. Integration Logic (Glue Code)

    // Wrapper for updateGlobalSetting to handle both Theme and Settings
    const updateGlobalSetting = useCallback((key, value) => {
        if (key === 'activeTheme') {
            setActiveTheme(value);
        } else {
            updateSettingInternal(key, value);
        }
    }, [setActiveTheme, updateSettingInternal]);

    // Apply Settings Logic (Sync Maturation)
    useEffect(() => {
        // SYNC: Update all sessions if maturation speed changed
        setSessions(prev => prev.map(session => {
            const creatureData = creatures[session.creature];
            if (!creatureData) return session;

            const newTotalTime = calculateMaturationTime(creatureData, settings);
            if (session.totalMaturationSeconds === newTotalTime) return session;

            console.log(`[Sync] Updating maturation for ${session.name}: ${session.totalMaturationSeconds} -> ${newTotalTime}`);
            return UpdateSession.execute(session, { totalMaturationSeconds: newTotalTime });
        }));
    }, [settings, setSessions]);

    // Modal Handlers
    const handleOpenAddModal = useCallback(() => {
        setIsAddModalOpen(true);
    }, []);

    // Session Management Logic
    const handleAddSession = useCallback((data) => {
        const sCreature = creatures[data.creature];
        const totalMaturationSeconds = calculateMaturationTime(sCreature, settings);

        const sessionData = {
            ...data,
            totalMaturationSeconds
        };

        if (data.isPlaying) {
            const activeCount = sessions.filter(s => s.data && s.data.isPlaying).length;
            if (activeCount >= MAX_ACTIVE_TRACKING) {
                addToast(t('errors.tracking_limit_reached', { limit: MAX_ACTIVE_TRACKING }), 'warning');
                addSession({ ...sessionData, isPlaying: false });
                return;
            }
        }
        addSession(sessionData);
    }, [sessions, addSession, addToast, t, settings]);

    const toggleTimer = () => {
        updateActiveSession((prev) => {
            if (!prev.data.isPlaying) {
                const activeCount = sessions.filter(s => s.data && s.data.isPlaying).length;
                if (activeCount >= MAX_ACTIVE_TRACKING) {
                    addToast(t('errors.tracking_limit_reached', { limit: MAX_ACTIVE_TRACKING }), 'error');
                    return prev;
                }
            }
            return {
                data: {
                    ...prev.data,
                    isPlaying: !prev.data.isPlaying
                }
            };
        });
    };

    const handleOnboardingComplete = (creatureData) => {
        // This relies on the hook consumer handling the state, but original used local state.
        // We will assume the component handles the showing based on the return value.
        // But wait, original had `setShowOnboarding`.
        localStorage.setItem('onboardingCompleted', 'v2.5');
        if (creatureData) {
            const newSession = CreateSession.execute({
                initialData: {
                    creature: creatureData.creature,
                    name: creatureData.name,
                    weight: creatureData.weight,
                    maturationPct: creatureData.maturationPct,
                    isPlaying: creatureData.isPlaying
                },
                existingCount: 0
            });
            setSessions([newSession]);
            switchSession(newSession.id);
        }
        // Force update of local state if identifying via return
        setShowOnboarding(false);
    };

    // Onboarding State (Local to composition)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('onboardingCompleted') !== 'v2.5';
    });

    // Global Maturation Timer (Triggers re-renders/clones)
    useEffect(() => {
        const interval = setInterval(() => {
            setSessions(prevSessions => {
                const somePlaying = prevSessions.some(s => s.isPlaying);
                if (!somePlaying) return prevSessions;
                return prevSessions.map(s => s.isPlaying ? s.clone() : s);
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [setSessions]);

    // Persist Misc State
    useEffect(() => {
        localStorage.setItem('gameVersion', gameVersion);
        localStorage.setItem('language', language);
    }, [gameVersion, language]);

    // PWA Force Update: Detect version bump and hard reload
    useEffect(() => {
        if (import.meta.env.DEV) return;

        const storedVersion = localStorage.getItem('appVersion');
        const currentVersion = __APP_VERSION__;

        if (storedVersion && storedVersion !== currentVersion) {
            console.log(`[PWA] Version bump detected: ${storedVersion} -> ${currentVersion}. Forcing reload...`);

            // 1. Update localStorage immediately to prevent infinite reload loop
            localStorage.setItem('appVersion', currentVersion);

            // 2. Clear application caches if possible (standard PWA cache is handled by SW)
            // 3. Perform hard reload
            window.location.reload(true);
        } else if (!storedVersion) {
            // Initial visit or cleared storage
            localStorage.setItem('appVersion', currentVersion);
        }
    }, []);

    return {
        // State
        sessions,
        activeSessionId,
        activeSession,
        settings,
        gameVersion,
        activeTheme,
        language,
        notifyEnabled,
        notifyTime,
        isAddModalOpen,
        isSettingsModalOpen,
        showOnboarding,

        // State Setters
        setSessions,
        setSettings,
        setGameVersion,
        setActiveTheme,
        setLanguage,
        setNotifyEnabled,
        setNotifyTime,
        setIsAddModalOpen,
        setIsSettingsModalOpen,
        setShowOnboarding,

        // Actions
        addSession,
        removeSession,
        switchSession,
        updateActiveSession,
        updateSession,
        handleAddSession,
        toggleTimer,
        handleNotifyToggle,
        updateGlobalSetting,
        handleOnboardingComplete,
        handleOpenAddModal,

        // Utils
        t,
        addToast,
        createGhostSession,
        promoteGhostSession,
        isGhostMode,
        trackedServers,
        fetchTrackedServers
    };
}
