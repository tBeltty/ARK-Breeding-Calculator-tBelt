import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal/Modal';
import styles from './CreditsModal.module.css';

const CreditsModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('ui.credits', 'Credits')}
            size="small"
        >
            <div className={styles.container}>
                <div className={styles.section}>
                    <p className={styles.madeBy}>
                        {t('credits.made_by', 'Made with ❤️ by')}{' '}
                        <a
                            href="https://github.com/tBeltty"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.authorLink}
                        >
                            tBelt
                        </a>
                    </p>
                </div>

                <div className={styles.divider} />

                <div className={`${styles.section} ${styles.bottomCredits}`}>
                    <h3 className={styles.role}>{t('credits.concept', 'Core Concept')}</h3>
                    <p className={styles.description}>
                        {t('credits.concept_desc', 'Food Calculator concept originally by')}
                    </p>
                    <a
                        href="https://github.com/Crumplecorn/ARK-Breeding-Calculator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        Crumplecorn
                    </a>
                </div>
            </div>
        </Modal>
    );
};

export default CreditsModal;
