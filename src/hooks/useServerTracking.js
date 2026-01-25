import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function useServerTracking(sessions, updateSession, addToast) {
    const { t } = useTranslation();
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

    // SERVER OFFLINE SYNC
    const syncServerDowntime = useCallback(async () => {
        try {
            const sessionsWithServers = sessions.filter(s => s.trackedServerId);
            if (sessionsWithServers.length === 0) return;

            console.log(`[Offline-Sync] Checking status for ${sessionsWithServers.length} tracked servers...`);

            for (const session of sessionsWithServers) {
                const response = await fetch(`/api/servers/status/${session.trackedServerId}`);
                if (!response.ok) continue;

                const status = await response.json();

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

                    // Update status if it changed
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

    return {
        trackedServers,
        fetchTrackedServers,
        syncServerDowntime
    };
}
