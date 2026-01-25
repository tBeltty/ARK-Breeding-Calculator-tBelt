import React, { useState } from 'react';
import styles from './DashboardComponents.module.css';

export function ServerSettingsEditor({ settings, channels, onSave }) {
    const [localSettings, setLocalSettings] = useState(settings);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(localSettings);
        setSaving(false);
    };

    return (
        <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Server Settings</h3>
            <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                    <label>Game Version</label>
                    <select name="game_version" value={localSettings.game_version} onChange={handleChange}>
                        <option value="ASA">ARK Survival Ascended</option>
                        <option value="ASE">ARK Survival Evolved</option>
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label>Maturation Speed</label>
                    <input
                        type="number"
                        name="server_rates"
                        value={localSettings.server_rates}
                        onChange={handleChange}
                        onFocus={(e) => e.target.select()}
                        min="0.1"
                        step="0.1"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>Alert Threshold (mins)</label>
                    <input
                        type="number"
                        name="alert_threshold"
                        value={localSettings.alert_threshold}
                        onChange={handleChange}
                        onFocus={(e) => e.target.select()}
                        min="1"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>Notify Mode (Creatures)</label>
                    <select name="notify_mode" value={localSettings.notify_mode} onChange={handleChange}>
                        <option value="channel">Channel-wide</option>
                        <option value="user">Private / User-focused</option>
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label>Server Alerts Channel</label>
                    <div className={styles.helperText} style={{ marginBottom: '4px', fontSize: '0.8em', color: '#888' }}>
                        Channel for Server Up/Down alerts and Channel-wide creature notifications.
                    </div>
                    <select name="notify_channel_id" value={localSettings.notify_channel_id || ''} onChange={handleChange}>
                        <option value="">-- Disabled / Default --</option>
                        {channels && channels.map(c => (
                            <option key={c.id} value={c.id}>#{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button
                onClick={handleSave}
                className={styles.saveBtn}
                disabled={saving}
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
}
