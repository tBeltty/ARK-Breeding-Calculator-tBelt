import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import styles from './TroughCalculator.module.css'; // Reusing styles for consistency
import { DataInput, LabelWithTooltip } from '../DataPanel';

export function TroughDurationInput({
    desiredHours,
    onDesiredHoursChange,
    isAutoDuration,
    onAutoDurationChange
}) {
    const { t } = useTranslation();

    return (
        <div className={styles.durationRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LabelWithTooltip
                    label={t('ui.desired_duration')}
                    tooltip={t('tooltips.trough_duration')}
                />
                {/* Auto Duration Toggle */}
                <label className={styles.checkboxLabel} style={{ marginLeft: '12px', fontSize: '0.85rem' }}>
                    <input
                        type="checkbox"
                        checked={isAutoDuration}
                        onChange={(e) => onAutoDurationChange(e.target.checked)}
                    />
                    <LabelWithTooltip
                        label={t('ui.auto_duration')}
                        tooltip={t('ui.auto_duration_tooltip')}
                        style={{ marginLeft: '4px', cursor: 'help' }}
                    />
                </label>
            </div>
            <div className={styles.durationInputWrapper}>
                <DataInput
                    key={isAutoDuration ? `auto-${desiredHours}` : 'manual'} // Force remount on value change
                    value={desiredHours}
                    onChange={onDesiredHoursChange}
                    min={0}
                    step={1}
                    placeholder="0"
                    showSteppers={false}
                    hideLabel={true}
                    disabled={isAutoDuration}
                />
            </div>
        </div>
    );
}

TroughDurationInput.propTypes = {
    desiredHours: PropTypes.number.isRequired,
    onDesiredHoursChange: PropTypes.func.isRequired,
    isAutoDuration: PropTypes.bool.isRequired,
    onAutoDurationChange: PropTypes.func.isRequired
};
