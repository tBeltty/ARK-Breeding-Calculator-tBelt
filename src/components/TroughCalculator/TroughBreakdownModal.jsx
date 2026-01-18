import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { NormalTroughBreakdown } from './NormalTroughBreakdown';
import { TekTroughBreakdown } from './TekTroughBreakdown';
import { MaewingBreakdown } from './MaewingBreakdown';
import styles from './TroughCalculator.module.css';

/**
 * Modal to show the breakdown of trough stacks.
 * Routes to the appropriate breakdown component based on trough type.
 */
export function TroughBreakdownModal({ isOpen, onClose, data, onFill, maxSlots, troughType }) {
    const { t } = useTranslation();

    if (!isOpen || !data) return null;

    // Select the appropriate breakdown component based on trough type
    const renderBreakdownContent = () => {
        switch (troughType) {
            case 'Tek Trough':
                return <TekTroughBreakdown data={data} maxSlots={maxSlots} />;
            case 'Maewing':
                return <MaewingBreakdown data={data} maxSlots={maxSlots} />;
            case 'Normal':
            default:
                return <NormalTroughBreakdown data={data} maxSlots={maxSlots} />;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('ui.breakdown_title')}
            footer={
                <button
                    className={styles.autoButton}
                    onClick={onFill}
                    style={{ width: 'auto', padding: '0 12px' }}
                >
                    {t('ui.fill_current', { count: maxSlots })}
                </button>
            }
        >
            {renderBreakdownContent()}
        </Modal>
    );
}

TroughBreakdownModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    data: PropTypes.shape({
        foodName: PropTypes.string,
        totalStacks: PropTypes.number,
        fullTroughs: PropTypes.number,
        leftover: PropTypes.number,
        maxDuration: PropTypes.number,
        refillCount: PropTypes.number
    }),
    onFill: PropTypes.func.isRequired,
    maxSlots: PropTypes.number.isRequired,
    troughType: PropTypes.string
};
