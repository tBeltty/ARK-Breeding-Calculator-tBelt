import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DataInput } from '../DataPanel';
import styles from './TroughCalculator.module.css';

/**
 * Creature list grid for trough calculator.
 * Displays creatures with maturation and quantity inputs.
 */
export function TroughCreatureList({
    creatureList,
    onAdd,
    onRemove,
    onUpdateMaturation,
    onUpdateQuantity
}) {
    const { t } = useTranslation();

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <span>{t('ui.creatures_in_trough')}</span>
                <button
                    className={styles.addButton}
                    onClick={onAdd}
                    title={t('tooltips.add_current_creature')}
                >
                    {t('ui.add_current')}
                </button>
            </div>

            {creatureList.length === 0 ? (
                <p className={styles.hint}>{t('ui.trough_hint')}</p>
            ) : (
                <>
                    <div className={styles.gridHeader}>
                        <div>{t('fields.creature')}</div>
                        <div className={styles.gridColCenter}>Mat %</div>
                        <div className={styles.gridColCenter}>Qty</div>
                        <div></div>
                    </div>
                    <ul className={styles.creatureList}>
                        {creatureList.map((entry, index) => (
                            <li key={index} className={styles.creatureItem}>
                                <span className={styles.creatureName}>{entry.name}</span>

                                <div className={styles.gridInputWrapper}>
                                    <DataInput
                                        label={`maturation-${index}`}
                                        value={Math.round(entry.maturation * 100)}
                                        onChange={(val) => onUpdateMaturation(index, val)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        placeholder="0"
                                        showSteppers={false}
                                        hideLabel={true}
                                        className={styles.compactInputWrapper}
                                    />
                                </div>

                                <div className={styles.gridInputWrapper}>
                                    <input
                                        type="number"
                                        className={styles.quantityInput}
                                        style={{ width: '100%', textAlign: 'center', height: '26px' }}
                                        value={entry.quantity}
                                        onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                        min={1}
                                        max={100}
                                    />
                                </div>

                                <div className={styles.removeButtonCell}>
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => onRemove(index)}
                                        title={t('tooltips.remove_creature')}
                                    >
                                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>&times;</span>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

TroughCreatureList.propTypes = {
    creatureList: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        maturation: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired
    })).isRequired,
    onAdd: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onUpdateMaturation: PropTypes.func.isRequired,
    onUpdateQuantity: PropTypes.func.isRequired
};
