import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataInput, LabelWithTooltip } from '../../DataPanel';
import { CreatureSelector } from '../../CreatureSelector';
import styles from '../../../App.module.css'; // Assuming shared styles
import { getNickname } from '../../../domain/constants/nicknames'; // Updated import path

export function CreaturePanel({
    isOpen,
    onToggle,
    session,
    creatures,
    onUpdateSession, // Passed down handler
    settings,
    trackedServers,
    createGhostSession,
    isGhostMode,
    activeData,
    onCreatureSelect // New prop
}) {
    const { t } = useTranslation();
    const weight = activeData.weight || 0;
    const maxFood = activeData.maxFood || 0;

    const handleCreatureChange = (newCreature) => {
        // Logic moved from ActiveSessionDetail
        // But we need calculateMaturationTime dependency?
        // Or callback from parent?
        // Parent passed onUpdateSession.
        // The logic for ghost session creation was in parent.
        // We should probably lift the complex ghost logic to parent or pass a specific handler 'onCreatureChange'.
        // For strict refactor without changing logic flow too much, let's assume parent handles the heavy lifting if we expose the right callback.

        // HOWEVER, to keep refactor simple, I will replicate the logic if dependencies are available, 
        // OR better: keep the handler in ActiveSessionDetail and pass it down.
    };

    // Wait, ActiveSessionDetail had complex handleCreatureChange.
    // I should pass `onCreatureChange` prop from ActiveSessionDetail to this panel.

    const updateDinoData = (key, value) => {
        onUpdateSession({
            data: { ...activeData, [key]: value }
        });
    };

    return (
        <DataPanel
            title={t('panels.creature')}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <CreatureSelector
                creatures={creatures}
                selectedCreature={session.creature}
                onSelect={onCreatureSelect}
            />
            <DataInput
                label={t('fields.weight')}
                tooltip={t('tooltips.weight')}
                value={weight}
                onChange={(v) => updateDinoData('weight', v)}
                min={1}
                max={10000}
            />
            {settings.advancedMode && (
                <DataInput
                    label={t('fields.max_food')}
                    tooltip={t('tooltips.max_food')}
                    value={maxFood}
                    onChange={(v) => updateDinoData('maxFood', v)}
                    min={0}
                    max={1000000}
                    placeholder={t('ui.auto_calculated')}
                    step={10}
                />
            )}
            <div className={styles.foodSelect} style={{ marginTop: '12px' }}>
                <LabelWithTooltip
                    label="Linked Server"
                    tooltip="Link this session to a monitored server to automatically adjust for downtime."
                    className={styles.label}
                />
                <select
                    value={activeData.trackedServerId || ''}
                    onChange={(e) => updateDinoData('trackedServerId', e.target.value)}
                    className={styles.select}
                >
                    <option value="">None (Local Only)</option>
                    {trackedServers.map(server => (
                        <option key={server.id} value={server.id}>
                            {server.name} ({server.status})
                        </option>
                    ))}
                </select>
            </div>
        </DataPanel>
    );
}
