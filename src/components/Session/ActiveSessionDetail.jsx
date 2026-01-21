import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataRow, DataInput, LabelWithTooltip } from '../DataPanel';
import { CreatureSelector } from '../CreatureSelector';
import { NotificationConfigModal } from '../NotificationConfigModal';
import { NotificationManager } from '../../infrastructure/NotificationManager';
import { useToast } from '../Toast';
import { formatTime } from '../../domain/breeding';
import { getNickname } from '../../utils/nicknames';
import styles from '../../App.module.css'; // We might want to split this css later

export function ActiveSessionDetail({
    session,
    calculations,
    settings,
    onUpdateSession, // Expects (updates) => ... or (key, value) => ...? Let's assume standard update pattern
    onUpdateGlobalSettings,
    creatures,
    foods,
    availableFoods,
    panelStates,
    onTogglePanel
}) {
    const { t } = useTranslation();
    const { addToast } = useToast();

    // Local state for UI logic that doesn't need to be in App.jsx
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [bufferLeadTime, setBufferLeadTime] = useState(10);

    const activeData = session?.data || {};
    const weight = activeData.weight || 0;
    const maxFood = activeData.maxFood || 0;
    const maturationProgress = activeData.maturation || 0;
    const selectedFood = activeData.selectedFood || availableFoods?.[0];
    const desiredBuffer = activeData.desiredBuffer || 60;
    const desiredBufferUnit = activeData.desiredBufferUnit || 'm';
    // notifyEnabled is passed in settings but not used directly here except via settings object


    // Helper for updating session data
    const updateDinoData = (key, value) => {
        onUpdateSession({
            data: { ...activeData, [key]: value }
        });
    };

    const handleCreatureChange = (newCreature) => {
        const creatureData = creatures[newCreature];
        if (creatureData) {
            onUpdateSession({
                creature: newCreature,
                name: getNickname(newCreature),
                data: {
                    ...activeData,
                    weight: creatureData.weight,
                    maturation: 0,
                    maxFood: 0
                }
            });
        }
    };

    const creature = session?.creature ? creatures[session.creature] : null;

    // Maturation needed calc
    const maturationNeededForBuffer = useMemo(() => {
        if (!calculations || !weight || !creature) return 0;
        const food = foods[selectedFood];
        if (!food) return 0;
        const rate = calculations.currentFoodRate;
        if (rate <= 0) return 0;
        const bufferInMinutes = desiredBufferUnit === 'h' ? desiredBuffer * 60 : desiredBuffer;
        const neededCapacityValues = (bufferInMinutes * rate);
        const neededSlots = neededCapacityValues / food.food;
        const neededWeight = neededSlots * food.weight;
        const neededMaturation = neededWeight / weight;
        return Math.min(100, Math.max(0, neededMaturation * 100));
    }, [calculations, desiredBuffer, desiredBufferUnit, weight, selectedFood, creature, foods]);

    if (!session || !session.creature) return null;

    return (
        <>
            {/* Creature Panel */}
            <DataPanel
                title={t('panels.creature')}
                isOpen={panelStates.creature}
                onToggle={() => onTogglePanel('creature')}
            >
                <CreatureSelector
                    creatures={creatures}
                    selectedCreature={session.creature}
                    onSelect={handleCreatureChange}
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
                <div className={styles.foodSelect}>
                    <LabelWithTooltip
                        label={t('fields.selected_food')}
                        tooltip={t('tooltips.selected_food')}
                        className={styles.label}
                    />
                    <select
                        value={selectedFood}
                        onChange={(e) => updateDinoData('selectedFood', e.target.value)}
                        className={styles.select}
                    >
                        {availableFoods.map(food => (
                            <option key={food} value={food}>{food}</option>
                        ))}
                    </select>
                </div>
            </DataPanel>

            {/* Settings Panel */}
            <DataPanel
                title={t('panels.settings')}
                isOpen={panelStates.settings}
                onToggle={() => onTogglePanel('settings')}
            >
                <DataInput
                    label={t('fields.hatch_speed')}
                    tooltip={t('tooltips.hatch_speed')}
                    value={settings.hatchSpeed}
                    onChange={(v) => onUpdateGlobalSettings('hatchSpeed', v)}
                    min={0.1}
                    step={0.1}
                />
                <DataInput
                    label={t('fields.maturation_speed')}
                    tooltip={t('tooltips.maturation_speed')}
                    value={settings.maturationSpeed}
                    onChange={(v) => onUpdateGlobalSettings('maturationSpeed', v)}
                    min={0.1}
                    step={0.1}
                />
                <DataInput
                    label={t('fields.consumption_speed')}
                    tooltip={t('tooltips.consumption_speed')}
                    value={settings.consumptionSpeed}
                    onChange={(v) => onUpdateGlobalSettings('consumptionSpeed', v)}
                    min={0.1}
                    step={0.1}
                />
                {settings.gameVersion === 'ASE' && (
                    <>
                        <DataInput
                            label={t('fields.gen2_hatch')}
                            tooltip={t('tooltips.gen2_hatch')}
                            value={settings.gen2HatchEffect}
                            onChange={(v) => onUpdateGlobalSettings('gen2HatchEffect', v)}
                            type="checkbox"
                        />
                        <DataInput
                            label={t('fields.gen2_growth')}
                            tooltip={t('tooltips.gen2_growth')}
                            value={settings.gen2GrowthEffect}
                            onChange={(v) => onUpdateGlobalSettings('gen2GrowthEffect', v)}
                            type="checkbox"
                        />
                    </>
                )}

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--outline-variant)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'rgb(var(--primary))' }}>{t('ui.notifications', 'Notifications')}</h4>
                    <DataInput
                        label={t('notifications.enable_push_tooltip')}
                        tooltip={t('notifications.enable_push_tooltip')}
                        value={settings.notifyEnabled}
                        onChange={settings.onToggleNotify}
                        type="checkbox"
                    />

                    {settings.notifyEnabled && (
                        <div className={styles.inputGroup} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <LabelWithTooltip
                                label={t('ui.notify_before', 'Notify Before')}
                                tooltip="Time before depletion to send alert"
                                className={styles.label}
                            />
                            <select
                                value={settings.notifyTime}
                                onChange={(e) => onUpdateGlobalSettings('notifyTime', Number(e.target.value))}
                                className={styles.select}
                                style={{ width: '100px' }}
                            >
                                <option value={5}>5m</option>
                                <option value={10}>10m</option>
                                <option value={30}>30m</option>
                            </select>
                        </div>
                    )}
                </div>
            </DataPanel>

            {/* Maturation Panel */}
            <DataPanel
                title={t('panels.maturation')}
                isOpen={panelStates.maturation}
                onToggle={() => onTogglePanel('maturation')}
            >
                <DataRow
                    label={t(`birth_types.${calculations?.birthLabel}`)}
                    tooltip={t('tooltips.birth_time')}
                    value={formatTime(calculations?.birthTime)}
                />
                <DataInput
                    label={t('fields.maturation_pct')}
                    tooltip={t('tooltips.maturation_pct')}
                    value={Number((maturationProgress * 100).toFixed(1))}
                    onChange={(v) => updateDinoData('maturation', Math.min(100, Math.max(0, v)) / 100)}
                    min={0}
                    max={100}
                    step={0.1}
                    decimals={1}
                    suffix="%"
                />


                <DataRow
                    label={t('fields.elapsed_time')}
                    tooltip={t('tooltips.elapsed_time')}
                    value={formatTime(calculations?.maturationTimeComplete)}
                />
                <DataRow
                    label={t('fields.time_to_juvenile')}
                    tooltip={t('tooltips.time_to_juvenile')}
                    value={formatTime(calculations?.babyTimeRemaining)}
                />
                <DataRow
                    label={t('fields.time_to_adult')}
                    tooltip={t('tooltips.time_to_adult')}
                    value={formatTime(calculations?.maturationTimeRemaining)}
                />
            </DataPanel>

            {/* Baby Panel */}
            <DataPanel
                title={t('panels.baby')}
                isOpen={panelStates.baby}
                onToggle={() => onTogglePanel('baby')}
            >
                <DataRow
                    label={t('fields.hand_feed_for')}
                    tooltip={t('tooltips.hand_feed_extended', { pct: calculations?.totalHandFeedPct.toFixed(1) })}
                    highlight={true}
                    value={
                        maturationProgress * 100 >= calculations?.totalHandFeedPct
                            ? t('ui.done')
                            : t('ui.hand_feed_remaining', {
                                pct: (calculations?.totalHandFeedPct - maturationProgress * 100).toFixed(1)
                            })
                    }
                />
                <DataRow
                    label={t('fields.current_buffer')}
                    tooltip={t('tooltips.current_buffer')}
                    highlight={true}
                    value={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{formatTime(calculations?.currentBuffer)}</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                <button
                                    onClick={() => setIsNotifyModalOpen(true)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--outline)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        padding: '2px 6px',
                                        color: 'var(--primary)',
                                        marginLeft: 'auto'
                                    }}
                                    title={t('ui.set_notification')}
                                >
                                    🔔
                                </button>
                                {isNotifyModalOpen && (
                                    <NotificationConfigModal
                                        isOpen={isNotifyModalOpen}
                                        onClose={() => setIsNotifyModalOpen(false)}
                                        leadTime={bufferLeadTime === '' ? 10 : Number(bufferLeadTime)}
                                        onLeadTimeChange={(val) => setBufferLeadTime(val)}
                                        currentBufferTime={formatTime(calculations?.currentBuffer)}
                                        onConfirm={() => {
                                            const time = bufferLeadTime === '' ? 10 : Number(bufferLeadTime);
                                            const delaySeconds = calculations.currentBuffer - (time * 60);

                                            if (delaySeconds <= 0) {
                                                addToast(t('messages.too_soon_for_notification'), 'warning');
                                                return;
                                            }

                                            const delayMs = delaySeconds * 1000;
                                            const id = NotificationManager.schedule(
                                                'buffer-alert',
                                                t('notifications.title_depleted'),
                                                t('notifications.body_depleted', { creature: creature.name || 'Creature' }),
                                                delayMs
                                            );

                                            if (id) {
                                                addToast(t('ui.notification_set_lead', { time: formatTime(calculations.currentBuffer), lead: time }), 'success');
                                            } else {
                                                NotificationManager.requestPermission().then(granted => {
                                                    if (granted) {
                                                        addToast(t('permissions.granted_retry'), 'info');
                                                    } else {
                                                        addToast(t('notifications.perm_denied'), 'error');
                                                    }
                                                });
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    }
                />

                <div className={styles.inputGroup} style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <DataInput
                            label={t('fields.desired_buffer')}
                            value={desiredBuffer}
                            onChange={(v) => updateDinoData('desiredBuffer', v)}
                            min={1}
                            hideLabel={false}
                        />
                    </div>
                    <select
                        value={desiredBufferUnit}
                        onChange={(e) => updateDinoData('desiredBufferUnit', e.target.value)}
                        className={styles.miniSelect}
                        style={{
                            marginLeft: '8px',
                            padding: '4px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgb(var(--surface-container-high))',
                            border: '1px solid rgb(var(--outline) / 0.3)',
                            marginBottom: '4px'
                        }}
                    >
                        <option value="m">{t('ui.minutes_short') || 'min'}</option>
                        <option value="h">{t('ui.hours_short') || 'h'}</option>
                    </select>
                </div>

                <DataRow
                    label={t('fields.maturation_needed')}
                    tooltip={t('tooltips.maturation_needed')}
                    value={
                        <span>
                            {maturationNeededForBuffer.toFixed(2)}%
                            <span style={{ fontSize: '0.8em', opacity: 0.7, marginLeft: '6px' }}>
                                ({maturationProgress * 100 < maturationNeededForBuffer ? '+' : ''}
                                {(maturationNeededForBuffer - maturationProgress * 100).toFixed(2)}%)
                            </span>
                        </span>
                    }
                />


                <DataRow
                    label={t('fields.food_capacity')}
                    tooltip={t('tooltips.food_capacity', { food: selectedFood })}
                    value={maxFood > 0 ? `${Number(maxFood).toLocaleString()} (Custom)` : calculations?.foodCapacity.toLocaleString()}
                />
            </DataPanel>
        </>
    );
}
