import React, { useState, useMemo } from 'react';
import creatures from '../../data/creatures.json';
import styles from './DashboardComponents.module.css';

const creatureNames = Object.keys(creatures).sort();

export function RemoteCommandRunner({ channels, onExecute }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCreature, setSelectedCreature] = useState(null);
    const [nickname, setNickname] = useState('');
    const [progress, setProgress] = useState(0);
    const [weight, setWeight] = useState('');
    const [targetChannel, setTargetChannel] = useState(channels[0]?.id || '');
    const [notifyMode, setNotifyMode] = useState('dm');
    const [notifyChannelId, setNotifyChannelId] = useState(channels[0]?.id || '');
    const [executing, setExecuting] = useState(false);

    const filteredCreatures = useMemo(() => {
        if (!searchTerm) return [];
        return creatureNames
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10);
    }, [searchTerm]);

    const handleExecute = async () => {
        if (!selectedCreature) return;

        setExecuting(true);
        try {
            await onExecute({
                creature: selectedCreature,
                nickname,
                progress: parseFloat(progress),
                weight: weight ? parseFloat(weight) : undefined,
                channelId: targetChannel,
                notifyMode,
                notifyChannelId: notifyMode === 'channel' ? notifyChannelId : undefined
            });
            // Reset form on success
            setSelectedCreature(null);
            setSearchTerm('');
            setNickname('');
            setProgress(0);
            setWeight('');
        } catch (e) {
            console.error(e);
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Remote Command Runner</h3>
            <p className={styles.description}>Start tracking a creature directly in a Discord channel.</p>

            <div className={styles.inputGrid}>
                {/* Creature Search */}
                <div className={styles.inputGroup} style={{ position: 'relative' }}>
                    <label>Creature Type</label>
                    <input
                        type="text"
                        placeholder="Search Rex, Wyvern..."
                        value={selectedCreature || searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedCreature(null);
                        }}
                        onFocus={(e) => e.target.select()}
                    />
                    {filteredCreatures.length > 0 && !selectedCreature && (
                        <div className={styles.autocompleteList}>
                            {filteredCreatures.map(name => (
                                <div
                                    key={name}
                                    className={styles.autocompleteItem}
                                    onClick={() => {
                                        setSelectedCreature(name);
                                        setSearchTerm('');
                                        setWeight(creatures[name].weight || '');
                                    }}
                                >
                                    {name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.inputGroup}>
                    <label>Nickname (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. Baby Rex 1"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        onFocus={(e) => e.target.select()}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Current Progress (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="99.9"
                        step="0.1"
                        value={progress}
                        onChange={(e) => setProgress(e.target.value)}
                        onFocus={(e) => e.target.select()}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Weight Stat (Optional)</label>
                    <input
                        type="number"
                        placeholder={selectedCreature ? `Dft: ${creatures[selectedCreature].weight}` : "Species weight"}
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        onFocus={(e) => e.target.select()}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Target Channel (Discord Log)</label>
                    <select value={targetChannel} onChange={(e) => setTargetChannel(e.target.value)}>
                        {channels.map(ch => (
                            <option key={ch.id} value={ch.id}>#{ch.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.divider} style={{ margin: '16px 0', borderTop: '1px solid var(--outline)', opacity: 0.2 }} />
            <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--primary)' }}>Personal Notification Settings</h4>

            <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                    <label>Notification Method</label>
                    <select value={notifyMode} onChange={(e) => setNotifyMode(e.target.value)}>
                        <option value="dm">Direct Message (Private)</option>
                        <option value="channel">Mention in Channel</option>
                    </select>
                </div>

                {notifyMode === 'channel' && (
                    <div className={styles.inputGroup}>
                        <label>Alert Channel</label>
                        <select value={notifyChannelId} onChange={(e) => setNotifyChannelId(e.target.value)}>
                            {channels.map(ch => (
                                <option key={ch.id} value={ch.id}>#{ch.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <button
                onClick={handleExecute}
                className={`${styles.saveBtn} ${styles.executeBtn}`}
                disabled={executing || !selectedCreature}
            >
                {executing ? 'Executing...' : '🚀 Start Tracking in Discord'}
            </button>
        </div>
    );
}
