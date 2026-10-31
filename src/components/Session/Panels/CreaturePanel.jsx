import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataInput, LabelWithTooltip } from '../../DataPanel';
import { CreatureSelector } from '../../CreatureSelector';
import styles from '../../../App.module.css'; // Assuming shared styles

export function CreaturePanel({
    isOpen,
    onToggle,
    session,
    creatures,
    onUpdateSession, // Passed down handler
    settings,
    trackedServers,
    activeData,
    onCreatureSelect // New prop
}) {
    const { t } = useTranslation();
    const weight = activeData.weight || 0;
    const maxFood = activeData.maxFood || 0;

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
