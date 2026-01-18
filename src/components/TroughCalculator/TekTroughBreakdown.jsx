import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

/**
 * Breakdown content for Tek Trough.
 * Capacity-limited - shows troughs OR refills as ALTERNATIVE options.
 * Refills are consumption-based (no edible food remaining).
 */
export function TekTroughBreakdown({ data, maxSlots }) {
    const { t } = useTranslation();
    const { totalStacks, fullTroughs, leftover, maxDuration, refillCount } = data;

    // Calculate troughs needed
    const troughsNeeded = Math.ceil(totalStacks / maxSlots);
    const additionalTroughs = troughsNeeded - 1;

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
            </div>

            {/* Tek specific: Show alternatives clearly */}
            {maxDuration > 0 && (troughsNeeded > 1 || refillCount > 0) && (
                <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'rgb(var(--surface-container-high) / 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgb(var(--outline) / 0.3)'
                }}>
                    <div style={{
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        marginBottom: '12px',
                        textAlign: 'center',
                        opacity: 0.9
                    }}>
                        {t('ui.tek_choose_option')}
                    </div>

                    {/* Option 1: More Tek Troughs */}
                    {additionalTroughs > 0 && (
                        <div style={{
                            padding: '10px',
                            marginBottom: '8px',
                            background: 'rgb(var(--success) / 0.1)',
                            border: '1px solid rgb(var(--success) / 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '1.2em' }}>🏠</span>
                            <div>
                                <strong style={{ color: 'rgb(var(--success))' }}>
                                    {t('ui.tek_add_troughs', { count: additionalTroughs })}
                                </strong>
                                <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '2px' }}>
                                    {t('ui.tek_no_refill_needed')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OR divider */}
                    {additionalTroughs > 0 && refillCount > 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '4px 0',
                            fontWeight: 'bold',
                            opacity: 0.6
                        }}>
                            — {t('ui.or')} —
                        </div>
                    )}

                    {/* Option 2: Refills (consumption-based) */}
                    {refillCount > 0 && (
                        <div style={{
                            padding: '10px',
                            background: 'rgb(var(--warning) / 0.1)',
                            border: '1px solid rgb(var(--warning) / 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '1.2em' }}>🔄</span>
                            <strong style={{ color: 'rgb(var(--warning))' }}>
                                {t('ui.tek_refill_option', {
                                    count: refillCount,
                                    hours: maxDuration.toFixed(1)
                                })}
                            </strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

TekTroughBreakdown.propTypes = {
    data: PropTypes.shape({
        totalStacks: PropTypes.number,
        fullTroughs: PropTypes.number,
        leftover: PropTypes.number,
        maxDuration: PropTypes.number,
        refillCount: PropTypes.number
    }).isRequired,
    maxSlots: PropTypes.number.isRequired
};
