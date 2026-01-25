import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DataInput, LabelWithTooltip } from '../DataPanel';
import { TROUGH_TYPES } from '@/domain/trough';
import styles from './TroughCalculator.module.css';

/**
 * Trough type selector with Maewing-specific inputs.
 */
export function TroughTypeSelector({
    troughType,
    onTroughTypeChange,
    gameVersion,
    maewingConfig,
    onMaewingConfigChange
}) {
    const { t } = useTranslation();

    const {
        weight,
        food,
        foodPoints,
        nursingEffectiveness,
        inputMode
    } = maewingConfig;

    const setInputMode = (newMode) => {
        onMaewingConfigChange({ ...maewingConfig, inputMode: newMode });
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <LabelWithTooltip
                    label={t('ui.trough_type')}
                    tooltip={t('tooltips.trough_type')}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                        className={styles.select}
                        value={troughType}
                        onChange={(e) => onTroughTypeChange(e.target.value)}
                        title={t('tooltips.trough_type')}
                    >
                        {Object.keys(TROUGH_TYPES).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    {troughType === 'Maewing' && (
                        <div className={styles.maewingInputs}>
                            <div className={styles.maewingStatInput}>
                                <DataInput
                                    label={t('ui.maewing_weight')}
                                    value={weight}
                                    onChange={(val) => onMaewingConfigChange({ ...maewingConfig, weight: val })}
                                    min={100}
                                    step={100}
                                    placeholder="1000"
                                    showSteppers={false}
                                    hideLabel={true}
                                />
                                <span className={styles.statLabel}>wt</span>
                            </div>

                            {gameVersion === 'ASE' ? (
                                <div className={styles.maewingStatInput}>
                                    <DataInput
                                        label={t('ui.nursing_effectiveness')}
                                        value={nursingEffectiveness}
                                        onChange={(val) => onMaewingConfigChange({ ...maewingConfig, nursingEffectiveness: val })}
                                        min={1}
                                        step={10}
                                        placeholder="100"
                                        showSteppers={false}
                                        hideLabel={true}
                                    />
                                    <span className={styles.statLabel}>%NE</span>
                                </div>
                            ) : (
                                <div className={styles.maewingStatInput}>
                                    <div className={styles.inputHeaderRow}>
                                        <span className={styles.statLabel}>
                                            {inputMode === 'basic' ? '🥩' : '🔭'}
                                        </span>
                                        <button
                                            className={styles.modeToggle}
                                            onClick={() => setInputMode(inputMode === 'basic' ? 'points' : 'basic')}
                                            title={t('tooltips.input_mode')}
                                        >
                                            {inputMode === 'basic' ? t('ui.input_mode_value') : t('ui.input_mode_points')}
                                        </button>
                                    </div>
                                    {inputMode === 'basic' ? (
                                        <DataInput
                                            label={t('ui.maewing_food')}
                                            value={food}
                                            onChange={(val) => onMaewingConfigChange({ ...maewingConfig, food: val })}
                                            min={100}
                                            step={100}
                                            placeholder="2000"
                                            showSteppers={false}
                                            hideLabel={true}
                                        />
                                    ) : (
                                        <DataInput
                                            label={t('ui.maewing_points')}
                                            value={foodPoints}
                                            onChange={(val) => onMaewingConfigChange({ ...maewingConfig, foodPoints: val })}
                                            min={0}
                                            step={1}
                                            placeholder="30"
                                            showSteppers={false}
                                            hideLabel={true}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

TroughTypeSelector.propTypes = {
    troughType: PropTypes.string.isRequired,
    onTroughTypeChange: PropTypes.func.isRequired,
    gameVersion: PropTypes.oneOf(['ASA', 'ASE']).isRequired,
    maewingConfig: PropTypes.shape({
        weight: PropTypes.number,
        food: PropTypes.number,
        foodPoints: PropTypes.number,
        nursingEffectiveness: PropTypes.number,
        inputMode: PropTypes.oneOf(['basic', 'points'])
    }).isRequired,
    onMaewingConfigChange: PropTypes.func.isRequired
};
