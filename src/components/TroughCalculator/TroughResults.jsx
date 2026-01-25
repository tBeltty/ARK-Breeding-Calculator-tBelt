import PropTypes from 'prop-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataRow } from '../DataPanel';
import { formatTime } from '@/domain/breeding';
import styles from './TroughCalculator.module.css';
import { NotificationManager } from '@/infrastructure/NotificationManager';

/**
 * Results display for trough simulation.
 */
export function TroughResults({ results, troughType, onToast }) {
    const { t } = useTranslation();
    const [leadTime, setLeadTime] = useState(5); // Minutes before empty

    if (!results) return null;

    const efficiency = results.totalFood > 0
        ? `${Math.round(results.eatenFood / results.totalFood * 100)}%`
        : '0%';

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <span>{t('ui.results')}</span>
            </div>
            <DataRow
                label={t('fields.trough_duration')}
                tooltip={t('tooltips.trough_duration')}
                value={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{formatTime(results.time)}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                            {/* Lead Time Input */}
                            <input
                                type="number"
                                value={leadTime === '' ? '' : leadTime}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLeadTime(val === '' ? '' : Number(val));
                                }}
                                onFocus={(e) => e.target.select()}
                                placeholder="5"
                                style={{
                                    width: '40px',
                                    textAlign: 'center',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    padding: '2px',
                                    fontSize: '0.8rem',
                                    color: 'inherit'
                                }}
                                title={t('tooltips.notify_lead_time')}
                            />
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>m</span>

                            <button
                                onClick={() => {
                                    // Use default if empty
                                    const time = leadTime === '' ? 5 : leadTime;

                                    // Calculate actual delay: Duration - LeadTime
                                    const delaySeconds = results.time - (time * 60);

                                    if (delaySeconds <= 0) {
                                        if (onToast) onToast(t('messages.too_soon_for_notification'), 'warning');
                                        else alert('Too soon!');
                                        return;
                                    }

                                    const delayMs = delaySeconds * 1000;
                                    const id = NotificationManager.schedule(
                                        'trough-refill',
                                        t('notifications.title_depleted'),
                                        t('notifications.body_depleted', { time: leadTime }),
                                        delayMs
                                    );

                                    if (id) {
                                        const msg = t('ui.notification_set_lead', { time: formatTime(results.time), lead: leadTime });
                                        if (onToast) onToast(msg, 'success');
                                        else alert(msg);
                                    } else {
                                        NotificationManager.requestPermission().then(granted => {
                                            if (granted) {
                                                if (onToast) onToast('Permission granted. Try again.', 'info');
                                            } else {
                                                if (onToast) onToast('Permission denied.', 'error');
                                            }
                                        });
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--outline)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '2px 6px',
                                    color: 'var(--primary)',
                                    marginLeft: '4px'
                                }}
                                title={t('ui.set_notification')}
                            >
                                🔔
                            </button>
                        </div>
                    </div>
                }
            />
            <DataRow
                label={t('fields.food_eaten')}
                tooltip={t('tooltips.food_eaten')}
                value={results.eatenFood.toLocaleString()}
            />
            <DataRow
                label={t('fields.food_spoiled')}
                tooltip={t('tooltips.food_spoiled')}
                value={results.spoiledFood.toLocaleString()}
            />
            <DataRow
                label={t('fields.efficiency')}
                tooltip={t('tooltips.efficiency')}
                value={efficiency}
            />
            {troughType === 'Maewing' && (
                <div className={styles.disclaimerWarning}>
                    <span>⚠️</span>
                    <div>
                        <strong>{t('ui.render_disclaimer_title')}</strong>
                        <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
                            {t('ui.render_disclaimer_text')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

TroughResults.propTypes = {
    results: PropTypes.shape({
        time: PropTypes.number,
        eatenFood: PropTypes.number,
        spoiledFood: PropTypes.number,
        totalFood: PropTypes.number,
        totalInitialStacks: PropTypes.number
    }),
    troughType: PropTypes.string.isRequired,
    settings: PropTypes.object,
    troughConfig: PropTypes.object
};
