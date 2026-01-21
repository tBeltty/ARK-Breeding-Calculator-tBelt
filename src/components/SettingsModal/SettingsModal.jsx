import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import styles from './SettingsModal.module.css';
import { version } from '../../../package.json';

export function SettingsModal({
    isOpen,
    onClose,
    globalSettings // { language, setLanguage, activeTheme, setActiveTheme, gameVersion, setGameVersion, notifyEnabled, onToggleNotify }
}) {
    const { t } = useTranslation();

    const {
        language,
        setLanguage,
        activeTheme,
        setActiveTheme,
        gameVersion,
        setGameVersion,
        notifyEnabled,
        onToggleNotify
    } = globalSettings;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('ui.settings', 'Settings')}
        >
            <div className={styles.container}>
                {/* Game Version */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>{t('ui.game_version', 'Game Version')}</div>
                    <div className={styles.row}>
                        <span className={styles.label}>{t('ui.edition', 'Edition')}</span>
                        <div className={styles.toggleGroup}>
                            <button
                                className={`${styles.toggleBtn} ${gameVersion === 'ASE' ? styles.active : ''}`}
                                onClick={() => setGameVersion('ASE')}
                            >
                                ASE
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${gameVersion === 'ASA' ? styles.active : ''}`}
                                onClick={() => setGameVersion('ASA')}
                            >
                                ASA
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>{t('ui.appearance', 'Appearance')}</div>

                    <div className={styles.row}>
                        <span className={styles.label}>{t('ui.theme', 'Theme')}</span>
                        <select
                            value={activeTheme}
                            onChange={(e) => setActiveTheme(e.target.value)}
                            className={styles.select}
                        >
                            <option value="arat-prime">Arat Prime</option>
                            <option value="crystal-horizon">Crystal Horizon</option>
                            <option value="aberrant-depths">Aberrant Depths</option>
                            <option value="frozen-peaks">Frozen Peaks</option>
                            <option value="tek-pulse">Tek Pulse</option>
                            <option value="primal-dawn">Primal Dawn</option>
                        </select>
                    </div>

                    <div className={styles.row}>
                        <span className={styles.label}>{t('ui.language', 'Language')}</span>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className={styles.select}
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </div>
                </div>

                {/* Notifications */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>{t('ui.notifications', 'Notifications')}</div>
                    <div className={styles.row}>
                        <div>
                            <div className={styles.label}>{t('notifications.enable_push', 'Enable Push Notifications')}</div>
                            <div className={styles.notifyDesc}>{t('notifications.desc', 'Get alerts when food is low')}</div>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={notifyEnabled}
                                onChange={onToggleNotify}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '8px', opacity: 0.5, fontSize: '0.8rem' }}>
                    v{version} • {gameVersion} Edition
                </div>
            </div>
        </Modal>
    );
}

SettingsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    globalSettings: PropTypes.shape({
        language: PropTypes.string,
        setLanguage: PropTypes.func,
        activeTheme: PropTypes.string,
        setActiveTheme: PropTypes.func,
        gameVersion: PropTypes.string,
        setGameVersion: PropTypes.func,
        notifyEnabled: PropTypes.bool,
        onToggleNotify: PropTypes.func
    }).isRequired
};
