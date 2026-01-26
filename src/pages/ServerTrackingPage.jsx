import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './ServerTrackingPage.module.css';

export default function ServerTrackingPage() {
    const { t } = useTranslation();
    const { sessions, updateSession, settings, trackedServers, fetchTrackedServers, updateGlobalSetting } = useOutletContext();
    const [serverData, setServerData] = useState({});
    const [loading, setLoading] = useState(true);

    // Get servers: Use context for personal tracking
    const trackedServerIds = useMemo(() => {
        const ids = new Set(sessions.map(s => s.trackedServerId).filter(Boolean));
        if (settings?.defaultServerId) {
            ids.add(settings.defaultServerId);
        }
        // Add persisted servers from database
        trackedServers.forEach(s => ids.add(s.id));

        return [...ids];
    }, [sessions, settings?.defaultServerId, trackedServers]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    // const { updateGlobalSetting } = useOutletContext(); // Grab global setter - already destructured above

    // Error / Rate Limit State
    const [errorMsg, setErrorMsg] = useState(null);
    const [retryTime, setRetryTime] = useState(0);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setErrorMsg(null);
        setRetryTime(0);

        try {
            // Determine if query is IP:Port (Unofficial) or Name (Official/Search)
            // Strict check: Must have 3 dots for IPv4 OR be a domain with a colon
            const isIp = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(searchQuery.trim()) || searchQuery.includes(':');

            if (isIp) {
                // If it looks like an IP, show it as a direct connect option
                setSearchResults([{
                    id: searchQuery.trim(),
                    name: `Unofficial (IP: ${searchQuery.trim()})`,
                    type: 'unofficial',
                    isDirect: true
                }]);
            } else {
                // Otherwise search API
                const response = await fetch(`/api/servers/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await response.json();

                if (response.ok) {
                    if (data.error === 'RATE_LIMIT') {
                        // Pick random immersive message
                        const messages = t('errors.rate_limits', { returnObjects: true });
                        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
                        setErrorMsg(randomMsg);
                        setRetryTime(data.retryAfter || 60);
                        setSearchResults([]);
                    } else {
                        setSearchResults(data);
                    }
                } else {
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleConnect = async (server) => {
        try {
            setLoading(true);

            // 1. Register with backend monitor (Essential for polling)
            await fetch('/api/servers/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serverId: server.id,
                    type: server.type || 'official', // Ensure type is passed
                    name: server.name
                })
            });

            // 2. Refresh local tracked list
            await fetchTrackedServers();

            // 3. Set as Default Global Server
            updateGlobalSetting('defaultServerId', server.id);

            // 4. Update ALL existing sessions to track this server
            // This force-migrates the user to the new monitored server
            sessions.forEach(session => {
                updateSession(session.id, { trackedServerId: server.id });
            });

            // 5. Cleanup
            setSearchQuery('');
            setSearchResults([]);

            // Ideally show a toast here, but we don't have addToast explicitly in context. 
            // We rely on the visual update of the grid.
        } catch (e) {
            console.error('Connection failed:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchStatuses = async () => {
            if (trackedServerIds.length === 0) {
                setLoading(false);
                return;
            }

            const results = {};
            for (const id of trackedServerIds) {
                try {
                    // Optimized: If we already have enriched data from context, use it as baseline
                    const persisted = trackedServers.find(s => s.id === id);
                    if (persisted) {
                        results[id] = persisted;
                    }

                    const response = await fetch(`/api/servers/status/${id}`);
                    if (response.ok) {
                        const status = await response.json();
                        results[id] = { ...results[id], ...status };
                    }
                } catch (e) {
                    console.error(`Failed to fetch status for ${id}`, e);
                }
            }
            setServerData(results);
            setLoading(false);
        };

        fetchStatuses();
        const interval = setInterval(fetchStatuses, 30000); // 30s refresh
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(trackedServerIds), trackedServers]);

    const handleRemove = async (serverId) => {
        if (!confirm('Stop tracking this server?')) return;
        try {
            const res = await fetch('/api/servers/track', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId })
            });
            if (res.ok) {
                fetchTrackedServers();
            }
        } catch (e) { console.error(e); }
    };

    // Countdown effect for rate limit
    useEffect(() => {
        if (retryTime > 0) {
            const timer = setInterval(() => {
                setRetryTime(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        } else if (retryTime === 0 && errorMsg) {
            // Optional: clear error when timer hits 0? Or leave it until they search again?
            // Let's leave it, but maybe change text to "Ready".
        }
    }, [retryTime, errorMsg]);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>🛰️ {t('panels.server_tracking')}</h1>
                <p className={styles.subtitle}>{t('ui.server_tracking_subtitle')}</p>
            </header>

            {/* Search & Connect Section */}
            <div className={styles.searchSection}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder={t('ui.search_placeholder_long')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className={styles.searchButton} disabled={isSearching || retryTime > 0}>
                        {isSearching ? '...' : retryTime > 0 ? `${retryTime}s` : t('ui.search')}
                    </button>
                </form>

                {errorMsg && (
                    <div className={styles.errorBanner} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', color: '#ffaaaa' }}>
                        <span>⚠️ {errorMsg} {retryTime > 0 && `(${retryTime}s)`}</span>
                    </div>
                )}

                {searchResults.length > 0 && (
                    <div className={styles.resultsList}>
                        {searchResults.map(result => (
                            <div key={result.id} className={styles.resultItem}>
                                <div className={styles.resultInfo}>
                                    <span className={styles.resultName}>{result.name}</span>
                                    <span className={styles.resultMeta}>{result.map} • {result.players}/{result.maxPlayers || '?'}</span>
                                </div>
                                <button
                                    className={styles.connectButton}
                                    onClick={() => handleConnect(result)}
                                >
                                    {t('ui.connect')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {loading && trackedServerIds.length > 0 ? (
                <div className={styles.loading}>{t('ui.loading')}</div>
            ) : trackedServerIds.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🛰️</div>
                    <h3>{t('ui.no_servers')}</h3>
                    <p>{t('ui.no_servers_desc')}</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {trackedServerIds.map(id => {
                        const s = serverData[id];
                        const isOnline = s?.status === 'online';

                        return (
                            <div key={id} className={`${styles.card} ${isOnline ? styles.online : styles.offline}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.statusIndicator} />
                                    <h3 className={styles.serverName}>{s?.name || (String(id).includes(':') ? `Private [${id}]` : `Official [${id}]`)}</h3>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <span className={styles.statusBadge}>{isOnline ? t('ui.online') : t('ui.offline')}</span>
                                        <button
                                            onClick={() => handleRemove(id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                                            title={t('tooltips.stop_tracking')}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {isOnline && (
                                    <div className={styles.stats}>
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>{t('ui.map')}</span>
                                            <span className={styles.statValue}>{s.map || 'Unknown'}</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>{t('ui.players')}</span>
                                            <span className={styles.statValue}>{s.players}/{s.maxPlayers}</span>
                                        </div>
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>{t('ui.health')}</span>
                                            <span className={styles.statValue}>{s.uptime || 100}%</span>
                                        </div>
                                    </div>
                                )}

                                {!isOnline && (
                                    <div className={styles.offlineMsg}>
                                        {s?.status === 'syncing'
                                            ? 'Contacting the Arks... (Please wait ~2 minutes)'
                                            : 'The server is currently Offline. Tracking is paused.'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
