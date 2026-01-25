import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataRow, DataInput } from '../../DataPanel';
import { NotificationConfigModal } from '../../NotificationConfigModal';
import { NotificationManager } from '../../../infrastructure/NotificationManager';
import { useToast } from '../../../hooks/useToast';
import { formatTime } from '../../../domain/breeding';
import styles from '../../../App.module.css';

export function BabyPanel({
    isOpen,
    onToggle,
    calculations,
    activeData,
    onUpdateSession,
    creature, // Object with name
    now // passed from parent interval
}) {
    const { t } = useTranslation();
    const { addToast } = useToast();

    // Local state moved from ActiveSessionDetail
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [bufferLeadTime, setBufferLeadTime] = useState(10);

    // Derived values
    const maturationProgress = activeData.maturation || 0;
    const desiredBuffer = activeData.desiredBuffer || 60;
    const desiredBufferUnit = activeData.desiredBufferUnit || 'm';
    const autoSortInterval = activeData.autoSortInterval !== undefined ? activeData.autoSortInterval : 12;

    const updateDinoData = (key, value) => {
        onUpdateSession({
            data: { ...activeData, [key]: value }
        });
    };

    // Maturation needed calc (duplicated from parent or passed? Parent calculated it.)
    // Wait, parent calculated 'maturationNeededForBuffer'.
    // I should probably pass 'maturationNeededForBuffer' as a prop to avoid recalculating or drilling dependencies.
    // Let's assume parent passes it.

    // Actually, looking at the code, it depends on many things.
    // To keep it clean, let's keep the calc logic in parent for now if it's complex, 
    // OR duplicate the memo if it's cheap. 
    // It depends on `calculations`, `weight`, `creature`, `foods`, `selectedFood`.
    // That's a lot of props. 

    // Simplification: logic stays here if I have the props.
    // But I don't want to pass `foods`, `availableFoods` just for this.
    // I will check if `maturationNeededForBuffer` was used anywhere else. NO.
    // So I can move the calculation here if I pass the raw data.

    // BUT, `ActiveSessionDetail` doesn't pass `foods` to `BabyPanel` currently in my plan.
    // I need to decide: Pass `maturationNeededForBuffer` or pass `foods`.
    // Passing `maturationNeededForBuffer` is cleaner interface.

    // So I will update `BabyPanel` to accept `maturationNeededForBuffer`.

    return (
        <DataPanel
            title={t('panels.baby')}
            isOpen={isOpen}
            onToggle={onToggle}
            data-testid="baby-panel"
        >
            <DataRow
                label={t('fields.hand_feed_for')}
                tooltip={t('tooltips.hand_feed_extended', { pct: calculations?.totalHandFeedPct?.toFixed(1) })}
                highlight={true}
                value={
                    maturationProgress * 100 >= calculations?.totalHandFeedPct
                        ? t('ui.done')
                        : (
                            <div>
                                <span>{t('ui.hand_feed_remaining', {
                                    pct: (calculations?.totalHandFeedPct - maturationProgress * 100).toFixed(1)
                                })}</span>
                                {calculations && (
                                    <span style={{ fontSize: '0.85em', opacity: 0.7, marginLeft: '6px' }}>
                                        ({formatTime(
                                            (activeData.totalMaturationSeconds || 0) *
                                            ((calculations.totalHandFeedPct - maturationProgress * 100) / 100)
                                        )})
                                    </span>
                                )}
                            </div>
                        )
                }
            />
            <DataRow
                label={t('fields.current_buffer')}
                tooltip={t('tooltips.current_buffer')}
                highlight={true}
                value={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        {/* Standard Display or Countdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                            <span style={{
                                fontWeight: activeData.foodTrackingEnabled ? 'bold' : 'normal',
                                color: activeData.foodTrackingEnabled
                                    ? (now > 0 && calculations?.currentBuffer - ((now - (activeData.lastRefillTime || now)) / 1000) < 300 ? '#ff5555' : '#55ff55')
                                    : 'inherit'
                            }}>
                                {activeData.foodTrackingEnabled
                                    ? (() => {
                                        // Countdown Logic
                                        if (now === 0) return '...';
                                        const elapsedSeconds = (now - (activeData.lastRefillTime || now)) / 1000;
                                        const originalBuffer = activeData.trackedBufferDuration || calculations?.currentBuffer;
                                        const remaining = Math.max(0, originalBuffer - elapsedSeconds);
                                        return `📉 ${formatTime(remaining)}`; // Down arrow to signify depletion
                                    })()
                                    : formatTime(calculations?.currentBuffer)
                                }
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {/* Tracking Controls */}
                                {activeData.foodTrackingEnabled ? (
                                    <button
                                        onClick={() => {
                                            // REFILL ACTION
                                            updateDinoData('lastRefillTime', Date.now());
                                            updateDinoData('trackedBufferDuration', calculations?.currentBuffer); // Snapshot current capacity
                                            addToast(t('messages.refill_success', 'Inventory Refilled! Timer reset.'), 'success');
                                        }}
                                        className={styles.actionButton}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                                        title="Refill Inventory (Reset Timer)"
                                    >
                                        🔄 {t('ui.refill_btn')}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            // START TRACKING
                                            updateDinoData('foodTrackingEnabled', true);
                                            updateDinoData('lastRefillTime', Date.now());
                                            updateDinoData('trackedBufferDuration', calculations?.currentBuffer);
                                        }}
                                        className={styles.actionButton}
                                        title="Start Tracking Depletion"
                                    >
                                        ⏱️ {t('ui.track_btn')}
                                    </button>
                                )}

                                {activeData.foodTrackingEnabled && (
                                    <button
                                        onClick={() => updateDinoData('foodTrackingEnabled', false)}
                                        className={styles.actionButton}
                                        style={{ opacity: 0.7 }}
                                        title="Stop Tracking"
                                    >
                                        ❌
                                    </button>
                                )}

                                {/* Notification Button */}
                                <button
                                    onClick={() => setIsNotifyModalOpen(true)}
                                    className={styles.iconButton}
                                    title={t('ui.set_notification')}
                                >
                                    🔔
                                </button>
                            </div>
                        </div>

                        {activeData.foodTrackingEnabled && (
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--on-surface-variant))', marginTop: '-4px' }}>
                                {t('ui.tracking_started', 'Tracking started')} {now > 0 ? formatTime((now - (activeData.lastRefillTime || now)) / 1000) : '...'} ago
                            </div>
                        )}

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
                        marginBottom: '4px' // Matched original styles
                    }}
                >
                    <option value="m">{t('ui.minutes_short') || 'min'}</option>
                    <option value="h">{t('ui.hours_short') || 'h'}</option>
                </select>
            </div>

            <div className={styles.inputGroup} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: 'rgb(var(--on-surface-variant))' }}>
                            {t('fields.auto_sort')}
                        </span>
                        {t('tooltips.auto_sort') && (
                            <span className={styles.tooltipIcon} title={t('tooltips.auto_sort')} style={{ marginLeft: '6px', fontSize: '12px', opacity: 0.7 }}>
                                ⓘ
                            </span>
                        )}
                    </div>
                    <select
                        value={autoSortInterval}
                        onChange={(e) => updateDinoData('autoSortInterval', Number(e.target.value))}
                        className={styles.miniSelect}
                        style={{
                            width: '100px',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgb(var(--surface-container-high))',
                            border: '1px solid rgb(var(--outline) / 0.3)',
                            color: 'rgb(var(--on-surface))'
                        }}
                    >
                        <option value={0}>{t('ui.off') || 'Off'}</option>
                        <option value={1}>1h</option>
                        <option value={12}>12h</option>
                        <option value={24}>24h</option>
                    </select>
                </div>
            </div>

            {/* We will need to pass this prop from parent */}
            <BabyPanel.MaturationNeeded
                t={t}
                maturationNeededForBuffer={activeData.maturationNeededForBuffer}
                maturationProgress={maturationProgress}
                totalMaturationSeconds={activeData.totalMaturationSeconds}
            />
        </DataPanel>
    );
}

// Subcomponent to handle the specific rendering if needed, 
// OR just put it inline.
// Inline is better since it uses local vars.
// But wait, maturationNeededForBuffer was calculated in parent hook.
// I'll assume it's passed in activeData or props.
// I'll add it as a prop.

BabyPanel.MaturationNeeded = ({ t, maturationNeededForBuffer, maturationProgress, totalMaturationSeconds }) => (
    <DataRow
        label={t('fields.maturation_needed')}
        tooltip={t('tooltips.maturation_needed')}
        value={
            maturationNeededForBuffer !== undefined ? (
                <span>
                    {maturationNeededForBuffer.toFixed(2)}%
                    <span style={{ fontSize: '0.8em', opacity: 0.7, marginLeft: '6px' }}>
                        ({maturationProgress * 100 < maturationNeededForBuffer ? '+' : ''}
                        {(maturationNeededForBuffer - maturationProgress * 100).toFixed(2)}%)
                    </span>
                    {maturationProgress * 100 < maturationNeededForBuffer && (
                        <span style={{ fontSize: '0.8em', opacity: 0.7, marginLeft: '6px', color: 'var(--primary)' }}>
                            ({formatTime(
                                (totalMaturationSeconds || 0) *
                                ((maturationNeededForBuffer - maturationProgress * 100) / 100)
                            )})
                        </span>
                    )}
                </span>
            ) : '-'
        }
    />
);
