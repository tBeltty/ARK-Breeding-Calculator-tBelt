import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UpdateSession } from '../application/usecases/UpdateSession';
import creatures from '../data/creatures.json';

export function useAutoRates(settings, setSettings, setSessions, addToast) {
    const { t } = useTranslation();

    // Keep a ref of settings to access in fetchAutoRates without adding a dependency
    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

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
    }, [setSettings, setSessions, addToast, t]);

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

    return { fetchAutoRates };
}
