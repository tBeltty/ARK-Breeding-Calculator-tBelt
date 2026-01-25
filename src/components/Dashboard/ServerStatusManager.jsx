import React, { useState, useEffect } from 'react';
import styles from './ServerStatusManager.module.css';

export function ServerStatusManager({ guildId, channels, globalSettings }) {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Unused
    const [notificationChannel, setNotificationChannel] = useState('');

    // Add Server State
    const [addMode, setAddMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Fetch Servers
    const fetchServers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/servers/tracked?guildId=${guildId}`);
            if (res.ok) {
                const data = await res.json();
                setServers(data);
            }
        } catch {
            // setError('Failed to load servers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (guildId) fetchServers();
    }, [guildId]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);

        try {
            // Check for IP
            const isIp = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(searchQuery.trim()) || searchQuery.includes(':');

            if (isIp) {
                setSearchResults([{
                    id: searchQuery.trim(),
                    name: `Unofficial (IP: ${searchQuery.trim()})`,
                    type: 'unofficial',
                    isDirect: true
                }]);
            } else {
                const response = await fetch(`/api/servers/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await response.json();

                if (response.ok) {
                    if (data.error === 'RATE_LIMIT') {
                        setSearchError(`Rate Update Limit: Retry in ${data.retryAfter}s`);
                    } else if (Array.isArray(data)) {
                        setSearchResults(data);
                    } else {
                        setSearchResults([]);
                    }
                }
            }
        } catch {
            setSearchError('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAdd = async (server) => {
        try {
            const res = await fetch('/api/servers/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serverId: server.id,
                    type: server.type || 'official',
                    name: server.name,
                    guildId: guildId,
                    channelId: notificationChannel || undefined // If empty, backend might default or ignore
                })
            });

            if (res.ok) {
                setAddMode(false);
                setSearchQuery('');
                setSearchResults([]);
                fetchServers();
            }
        } catch {
            alert('Failed to add server');
        }
    };



    const handleRemove = async (serverId) => {
        if (!confirm('Are you sure you want to stop tracking this server?')) return;
        try {
            const res = await fetch('/api/servers/track', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId, guildId })
            });
            if (res.ok) fetchServers();
        } catch (e) { console.error(e); }
    };

    const handleChannelChange = async (serverId, newChannelId) => {
        // Optimistic update
        setServers(prev => prev.map(s => s.id === serverId ? { ...s, channel_id: newChannelId || null } : s));

        try {
            await fetch(`/api/servers/${serverId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId, channelId: newChannelId || null })
            });
            // Silent success or toast?
        } catch (e) {
            console.error('Failed to update channel', e);
            fetchServers(); // Revert on error
        }
    };

    // Calculate Default Channel Name
    const defaultChannelId = globalSettings?.notify_channel_id;
    const defaultChannelName = channels?.find(c => c.id === defaultChannelId)?.name || 'Disabled';

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3>Managed Servers ({servers.length})</h3>
                </div>
                <button
                    onClick={() => setAddMode(!addMode)}
                    className={addMode ? styles.cancelBtn : styles.addBtn}
                >
                    {addMode ? 'Cancel' : '+ Add Server'}
                </button>
            </div>

            {addMode && (
                <div className={styles.addSection}>
                    <div className={styles.channelSelect}>
                        <label>Notification Channel (Optional Override):</label>
                        <select
                            value={notificationChannel}
                            onChange={e => setNotificationChannel(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">-- Use Global Default (#{defaultChannelName}) --</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>#{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        <input
                            type="text"
                            placeholder="Search Official Name or IP:Port..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={styles.input}
                        />
                        <button type="submit" disabled={isSearching} className={styles.searchBtn}>
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </form>

                    {searchError && <div className={styles.error}>{searchError}</div>}

                    {searchResults.length > 0 && (
                        <div className={styles.results}>
                            {searchResults.map(res => (
                                <div key={res.id} className={styles.resultItem}>
                                    <span>{res.name}</span>
                                    <button onClick={() => handleAdd(res)} className={styles.trackBtn}>Track</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.list}>
                {loading ? (
                    <div className={styles.loading}>Loading servers...</div>
                ) : servers.length === 0 ? (
                    <div className={styles.empty}>No servers tracked for this guild.</div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Server Name</th>
                                    <th>Alert Channel</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servers.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <div className={styles.serverName}>{s.name}</div>
                                            <div className={styles.serverId}>{s.id}</div>
                                        </td>
                                        <td>
                                            <select
                                                value={s.channel_id || ''}
                                                onChange={(e) => handleChannelChange(s.id, e.target.value)}
                                                className={styles.miniSelect}
                                                style={{ maxWidth: '150px' }}
                                            >
                                                <option value="">Default (#{defaultChannelName})</option>
                                                {channels && channels.map(c => (
                                                    <option key={c.id} value={c.id}>#{c.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${s.status === 'online' ? styles.online : styles.offline}`}>
                                                {s.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => handleRemove(s.id)} className={styles.deleteBtn} title="Stop Tracking">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
