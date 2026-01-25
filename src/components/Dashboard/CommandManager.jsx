import React, { useState } from 'react';
import styles from './DashboardComponents.module.css';

export function CommandManager({ channels, roles, restrictions, onSave }) {
    const [localRestrictions, setLocalRestrictions] = useState(() => {
        try {
            // Attempt to parse existing settings
            const parsed = typeof restrictions === 'string' ? JSON.parse(restrictions) : (restrictions || {});

            // Migration check: If it looks like the old format (key -> array of channels), migrate to new format
            // Old: { "track": ["123", "456"] }
            // New: { "track": { channels: ["123", "456"], roles: [] } }
            const migrated = {};
            Object.keys(parsed).forEach(key => {
                if (Array.isArray(parsed[key])) {
                    migrated[key] = { channels: parsed[key], roles: [] };
                } else {
                    migrated[key] = parsed[key];
                }
            });
            return migrated;
        } catch { return {}; }
    });
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('channels'); // 'channels' or 'roles'

    const commands = [
        { id: 'server-track', name: '/server-track' },
        { id: 'track', name: '/track' },
        { id: 'buffer', name: '/buffer' },
        { id: 'trough', name: '/trough' },
        { id: 'status', name: '/status' },
        { id: 'settings', name: '/settings' }
    ];

    const togglePermission = (cmdId, type, itemId) => {
        setLocalRestrictions(prev => {
            const cmdRules = prev[cmdId] || { channels: [], roles: [] };
            const currentList = cmdRules[type] || [];

            const newList = currentList.includes(itemId)
                ? currentList.filter(id => id !== itemId)
                : [...currentList, itemId];

            return {
                ...prev,
                [cmdId]: {
                    ...cmdRules,
                    [type]: newList
                }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(JSON.stringify(localRestrictions));
        setSaving(false);
    };

    return (
        <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Command Permissions</h3>
            <p className={styles.description}>
                Configure where commands can be used and who can use them.
                <br />
                <small>If authorized lists are empty, the command is allowed for <strong>everyone</strong> (default Discord permissions apply).</small>
            </p>

            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'channels' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('channels')}
                >
                    # Channels
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'roles' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    @ Roles
                </button>
            </div>

            <div className={styles.commandTable}>
                {commands.map(cmd => {
                    const rules = localRestrictions[cmd.id] || { channels: [], roles: [] };
                    const activeCount = activeTab === 'channels' ? (rules.channels?.length || 0) : (rules.roles?.length || 0);

                    return (
                        <div key={cmd.id} className={styles.commandRow}>
                            <div className={styles.commandHeader}>
                                <strong>{cmd.name}</strong>
                                <span className={styles.badge}>{activeCount > 0 ? `${activeCount} restricted` : 'Public'}</span>
                            </div>

                            <div className={styles.channelGrid}>
                                {activeTab === 'channels' && channels.map(ch => (
                                    <button
                                        key={ch.id}
                                        className={`${styles.channelChip} ${(rules.channels || []).includes(ch.id) ? styles.activeChip : ''}`}
                                        onClick={() => togglePermission(cmd.id, 'channels', ch.id)}
                                    >
                                        #{ch.name}
                                    </button>
                                ))}

                                {activeTab === 'roles' && roles.map(role => (
                                    <button
                                        key={role.id}
                                        className={`${styles.channelChip} ${(rules.roles || []).includes(role.id) ? styles.activeChip : ''}`}
                                        onClick={() => togglePermission(cmd.id, 'roles', role.id)}
                                        style={{
                                            borderColor: role.color !== '#000000' ? role.color : 'var(--outline)',
                                            color: (rules.roles || []).includes(role.id) ? 'var(--on-primary-container)' : 'inherit'
                                        }}
                                    >
                                        <span style={{ color: role.color !== '#000000' ? role.color : 'inherit', marginRight: '4px' }}>@</span>
                                        {role.name}
                                    </button>
                                ))}

                                {((activeTab === 'channels' && channels.length === 0) || (activeTab === 'roles' && roles.length === 0)) && (
                                    <span className={styles.emptyText}>No {activeTab} found.</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSave}
                className={styles.saveBtn}
                disabled={saving}
                style={{ marginTop: '24px' }}
            >
                {saving ? 'Saving Permissions...' : 'Update Permissions'}
            </button>
        </div>
    );
}
