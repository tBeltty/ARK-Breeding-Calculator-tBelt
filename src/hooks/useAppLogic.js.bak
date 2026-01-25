import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMultiDinoState } from './useMultiDinoState';
import { loadSettings, saveSettings } from '../infrastructure/LocalStorageSettingsRepository';
import { NotificationManager } from '../infrastructure/NotificationManager';
import { CreateSession } from '../application/usecases/CreateSession';
import { UpdateSession } from '../application/usecases/UpdateSession';
import { calculateMaturationTime } from '../domain/breeding';
import creatures from '../data/creatures.json';
import i18n from '../i18n';

const MAX_ACTIVE_TRACKING = 20;

export function useAppLogic(addToast) {
    const { t } = useTranslation();

    // Multi-Dino State Management
    const {
        sessions, // Restored
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

    // Global Settings
    const [settings, setSettings] = useState(loadSettings);

    // Persist Global Settings
    useEffect(() => {
        saveSettings(settings);

        // SYNC: Update all sessions if maturation speed changed
        setSessions(prev => prev.map(session => {
            const creatureData = creatures[session.creature];
            if (!creatureData) return session;

            const newTotalTime = calculateMaturationTime(creatureData, settings);
            if (session.totalMaturationSeconds === newTotalTime) return session;

            console.log(`[Sync] Updating maturation for ${session.name}: ${session.totalMaturationSeconds} -> ${newTotalTime}`);
            return UpdateSession.execute(session, { totalMaturationSeconds: newTotalTime });
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings, setSessions]);

    // Keep a ref of settings to access in fetchAutoRates without adding a dependency
    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // Global App State
    const [gameVersion, setGameVersion] = useState(() => localStorage.getItem('gameVersion') || 'ASA');
    const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('activeTheme') || 'arat-prime');
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

    // Trough/Global Settings
    const [notifyEnabled, setNotifyEnabled] = useState(() => localStorage.getItem('notifyEnabled') === 'true');
    const [notifyTime, setNotifyTime] = useState(10);

    // Server Tracking State
    const [trackedServers, setTrackedServers] = useState([]);

    const fetchTrackedServers = useCallback(async () => {
        try {
            const response = await fetch('/api/servers/tracked');
            if (response.ok) {
                const data = await response.json();
                setTrackedServers(data);
            }
        } catch (e) {
            console.error('Failed to fetch tracked servers:', e);
        }
    }, []);

    useEffect(() => {
        fetchTrackedServers();
    }, [fetchTrackedServers]);

    // Apply Theme & Language
    useEffect(() => {
        document.body.className = `theme-${activeTheme}`;
        const themeBackgrounds = {
            'arat-prime': 'aratprime.png',
            'tek-pulse': 'tekpulse.png',
            'primal-dawn': 'primaldawn.png',
            'aberrant-depths': 'aberrantdepths.png',
            'frozen-peaks': 'ash.png',
            'crystal-horizon': 'crystal.png'
        };
        const bgImage = themeBackgrounds[activeTheme] || 'aratprime.png';
        document.documentElement.style.setProperty('--bg-image', `url('/${bgImage}')`);
    }, [activeTheme]);

    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language]);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const handleOpenAddModal = useCallback(() => {
        setIsAddModalOpen(true);
    }, []);

    // Wrapper for adding session
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

    const isNotifyProcessingRef = useRef(false);

    const handleNotifyToggle = async () => {
        if (isNotifyProcessingRef.current) return;
        isNotifyProcessingRef.current = true;
        try {
            if (!notifyEnabled) {
                const granted = await NotificationManager.requestPermission();
                if (granted) {
                    setNotifyEnabled(true);
                    addToast(t('messages.notification_enabled'), 'success');
                } else {
                    if ('Notification' in window && Notification.permission === 'denied') {
                        addToast(t('notifications.perm_blocked_hint'), 'error', 5000);
                    } else {
                        addToast(t('notifications.perm_denied'), 'error');
                    }
                    setNotifyEnabled(false);
                }
            } else {
                setNotifyEnabled(false);
                addToast(t('messages.notification_disabled'), 'info');
            }
        } catch (error) {
            console.error('Notification toggle error:', error);
        } finally {
            setTimeout(() => {
                isNotifyProcessingRef.current = false;
            }, 1500);
        }
    };

    const updateGlobalSetting = (key, value) => {
        if (key === 'activeTheme') {
            setActiveTheme(value);
            localStorage.setItem('activeTheme', value);
        } else {
            setSettings(prev => {
                const newSettings = { ...prev, [key]: value };
                // Reset rates to x1 if Auto-Rates is disabled (User Request)
                if (key === 'autoRatesEnabled' && value === false) {
                    console.log('[Settings] Auto-Rates disabled. Resetting to 1x.');
                    newSettings.maturationSpeed = 1;
                    newSettings.hatchSpeed = 1;
                    newSettings.consumptionSpeed = 1;
                }
                return newSettings;
            });
        }
    };

    // Global Maturation Timer (Now just triggers re-renders)
    useEffect(() => {
        const interval = setInterval(() => {
            setSessions(prevSessions => {
                const somePlaying = prevSessions.some(s => s.isPlaying);
                if (!somePlaying) return prevSessions;

                // We return a new array AND new object references for playing sessions
                // This ensures useMemo dependencies (activeSession) trigger updates
                return prevSessions.map(s => s.isPlaying ? s.clone() : s);
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [setSessions]);

    useEffect(() => {
        localStorage.setItem('gameVersion', gameVersion);
        localStorage.setItem('language', language);
        localStorage.setItem('notifyEnabled', notifyEnabled);
        localStorage.setItem('activeTheme', activeTheme);
    }, [gameVersion, language, notifyEnabled, activeTheme]);

    // AUTO-RATES SYNC
    const fetchAutoRates = useCallback(async () => {
        const currentSettings = settingsRef.current;
        if (!currentSettings.autoRatesEnabled) return;

        try {
            console.log('[Auto-Rates] Fetching current official rates...');
            const response = await fetch('/api/rates');
            if (!response.ok) {
                console.error('[Auto-Rates] HTTP Error:', response.status);
                return;
            }

            const data = await response.json();
            console.log('[Auto-Rates] Received data:', data);
            const { maturation, lastChangedAt } = data;

            // Helper to update setting if changed
            let updates = {};
            console.log('[Auto-Rates] Current Settings:', { m: currentSettings.maturationSpeed, h: currentSettings.hatchSpeed });
            if (maturation && maturation !== currentSettings.maturationSpeed) {
                console.log('[Auto-Rates] Maturation change detected:', maturation);
                updates.maturationSpeed = maturation;
            }
            if (data.hatch && data.hatch !== currentSettings.hatchSpeed) {
                console.log('[Auto-Rates] Hatch change detected:', data.hatch);
                updates.hatchSpeed = data.hatch;
            }
            if (data.consumption && data.consumption !== currentSettings.consumptionSpeed) updates.consumptionSpeed = data.consumption;

            if (Object.keys(updates).length > 0) {
                console.log('[Auto-Rates] Updating settings:', updates);

                // 1. Update Global Settings
                setSettings(prev => ({ ...prev, ...updates }));

                // 2. Perform Retroactive Correction for all active sessions (Only if maturation changed)
                if (updates.maturationSpeed) {
                    setSessions(prevSessions => prevSessions.map(session => {
                        const creatureData = creatures[session.creature];
                        if (!creatureData || !session.isPlaying) return session;

                        // Calculate maturation with OLD rate
                        const oldTotalTime = 1 / creatureData.agespeed / creatureData.agespeedmult / currentSettings.maturationSpeed;
                        // Calculate maturation with NEW rate
                        const newTotalTime = 1 / creatureData.agespeed / creatureData.agespeedmult / updates.maturationSpeed;

                        // Use retroactive logic in Session.js
                        const correctedPct = session.calculateRetroactiveProgress ?
                            session.calculateRetroactiveProgress(lastChangedAt || Date.now(), oldTotalTime, newTotalTime) :
                            session.maturationPct;

                        console.log(`[Auto-Rates] Correcting ${session.name}: ${correctedPct.toFixed(4)}`);

                        const updated = UpdateSession.execute(session, {
                            maturationPct: correctedPct,
                            totalMaturationSeconds: newTotalTime
                        });

                        // Soft Reset to lock in the corrected percentage as the new start point
                        updated.softReset();
                        return updated;
                    }));
                }

                addToast(t('messages.rates_updated_auto', { rate: `${maturation}x/${data.hatch}x` }), 'info', 10000);
            }
        } catch (error) {
            console.error('[Auto-Rates] Sync failed:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setSessions, addToast, t]);

    // Polling Effect
    useEffect(() => {
        // Only start polling if enabled
        if (settings.autoRatesEnabled) {
            // Immediate fetch on mount or enable
            fetchAutoRates();
            const interval = setInterval(fetchAutoRates, 15 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [settings.autoRatesEnabled, fetchAutoRates]);

    // SERVER OFFLINE SYNC (Vision 3.0)
    const syncServerDowntime = useCallback(async () => {
        try {
            const sessionsWithServers = sessions.filter(s => s.trackedServerId);
            if (sessionsWithServers.length === 0) return;

            console.log(`[Offline-Sync] Checking status for ${sessionsWithServers.length} tracked servers...`);

            for (const session of sessionsWithServers) {
                const response = await fetch(`/api/servers/status/${session.trackedServerId}`);
                if (!response.ok) continue;

                const status = await response.json();

                // If server is offline, we increment the local offline timer
                // This is a naive implementation: if we poll every 15 mins and it's offline, 
                // we assume it was offline for those 15 mins.
                // A better way would be using the bot's history endpoint (planned in Vision 3.0).
                if (status.status === 'offline') {
                    console.log(`[Offline-Sync] Server ${session.trackedServerId} is OFFLINE. Adjusting ${session.name}...`);
                    updateSession(session.id, {
                        offlineSeconds: (session.offlineSeconds || 0) + (15 * 60),
                        lastServerStatus: 'offline'
                    });
                } else if (status.status === 'online') {
                    // Check for transition from offline -> online
                    if (session.lastServerStatus === 'offline') {
                        addToast(
                            t('notifications.server_back_online', {
                                name: session.name,
                                msg: 'Server is back online! We adjusted for downtime, but recommend verifying maturation % manually for max accuracy.'
                            }),
                            'warning',
                            10000
                        );
                    }

                    // Update status if it changed (to avoid spamming updates)
                    if (session.lastServerStatus !== 'online') {
                        updateSession(session.id, { lastServerStatus: 'online' });
                    }
                }
            }
        } catch (error) {
            console.error('[Offline-Sync] Failed:', error);
        }
    }, [sessions, updateSession, addToast, t]);

    useEffect(() => {
        const interval = setInterval(syncServerDowntime, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [syncServerDowntime]);

    // Onboarding
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('onboardingCompleted') !== 'v2.5';
    });

    const handleOnboardingComplete = (creatureData) => {
        setShowOnboarding(false);
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
    };

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
