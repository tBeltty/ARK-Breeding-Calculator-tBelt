import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from './TroughCalculator.module.css';

/**
 * Breakdown content for Maewing.
 * Weight-limited - shows weight requirements.
 */
export function MaewingBreakdown({ data, maxSlots }) {
    const { t } = useTranslation();
    const { totalStacks, fullTroughs, leftover, maxDuration, refillCount } = data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ color: 'rgb(var(--primary))' }}>
                {t('ui.breakdown_total', { count: totalStacks })}
            </strong>
            <div style={{
                marginTop: '8px',
                padding: '12px',
                background: 'rgb(var(--surface-container-high) / 0.5)',
                borderRadius: 'var(--radius-sm)'
            }}>
                <div>
                    ✅ {t('ui.breakdown_full', {
                        count: fullTroughs,
                        slots: maxSlots
                    })}
                </div>
                {leftover > 0 && (
                    <div style={{ marginTop: '4px' }}>
                        ➕ {t('ui.breakdown_partial', { count: leftover })}
                    </div>
                )}

                {maxDuration > 0 && (
                    <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgb(var(--outline) / 0.2)',
                        color: 'rgb(var(--warning))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>⏰</span>
                        <strong>
                            {t('ui.refill_every', {
                                hours: maxDuration.toFixed(1)
                            })}
                        </strong>
                    </div>
                )}

                {refillCount > 0 && (
                    <div style={{
                        marginTop: '4px',
                        paddingTop: '4px',
                        color: 'rgb(var(--primary))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>🔄</span>
                        <strong>
                            {t('ui.refill_times', {
                                count: refillCount
                            })}
                        </strong>
                    </div>
                )}

                {/* Maewing-specific disclaimer */}
                <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgb(var(--outline) / 0.2)',
                    fontSize: '0.85em',
                    opacity: 0.8
                }}>
                    ⚠️ {t('ui.maewing_weight_limited')}
                </div>
            </div>
        </div>
    );
}

MaewingBreakdown.propTypes = {
    data: PropTypes.shape({
        totalStacks: PropTypes.number,
        fullTroughs: PropTypes.number,
        leftover: PropTypes.number,
        maxDuration: PropTypes.number,
        refillCount: PropTypes.number
    }).isRequired,
    maxSlots: PropTypes.number.isRequired
};
