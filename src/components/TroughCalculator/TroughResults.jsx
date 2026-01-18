import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DataRow } from '../DataPanel';
import { formatTime } from '@/domain/breeding';
import styles from './TroughCalculator.module.css';

/**
 * Results display for trough simulation.
 */
export function TroughResults({ results, troughType, settings, troughConfig }) {
    const { t } = useTranslation();

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
                value={formatTime(results.time)}
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

            <div style={{ marginTop: '16px', fontSize: '0.7em', opacity: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                <div>Debug Info:</div>
                <div>Spoil Mult: {troughConfig?.spoilMultiplier}x</div>
                <div>Settings: SpoilTime {settings?.consumablesSpoilTime}x</div>
                {settings?.stackMultiplier && <div>Stack Mult: {settings.stackMultiplier}x</div>}
                <div>Initial Stacks: {results?.totalInitialStacks}</div>
            </div>
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
