import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal, ConfirmationModal } from '../Modal';
import styles from './SettingsModal.module.css';
import { version } from '../../../package.json';
import { BackupService } from '../../infrastructure/BackupService';
import { useToast } from '../Toast';

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

    const fileInputRef = React.useRef(null);
    // Since useToast is a hook, we need access to addToast. 
    // Wait, useToast is typically used in a component wrapped by ToastProvider.
    // Let's assume SettingsModal is inside the provider.
    const { addToast } = useToast();

    // Import Confirmation State
    const [pendingFile, setPendingFile] = React.useState(null);

    const handleExport = () => {
        try {
            BackupService.exportData();
            addToast(t('messages.backup_created', 'Backup created successfully'), 'success');
        } catch (e) {
            addToast(t('messages.backup_failed', 'Export failed'), 'error');
        }
    };

    const onFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingFile(file);
        }
        // Reset input immediately so same file can be selected again if cancelled
        e.target.value = '';
    };

    const executeImport = async () => {
        if (!pendingFile) return;

        try {
            await BackupService.importData(pendingFile);
            addToast(t('messages.import_success', 'Data restored successfully'), 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error(err);
            addToast(t('messages.import_failed', 'Import failed: Invalid file'), 'error');
        } finally {
            setPendingFile(null);
        }
    };

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

                {/* Data Management */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>{t('ui.data_management', 'Data Management')}</div>
                    <div className={styles.row}>
                        <div>
                            <div className={styles.label}>{t('ui.backup_restore', 'Backup & Restore')}</div>
                            <div className={styles.notifyDesc}>{t('ui.backup_restore_desc', 'Export your data or restore from a file')}</div>
                        </div>
                        <div className={styles.toggleGroup}>
                            <button
                                className={styles.toggleBtn}
                                onClick={handleExport}
                            >
                                {t('ui.export', 'Export')}
                            </button>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {t('ui.import', 'Import')}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={onFileSelect}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '8px', opacity: 0.5, fontSize: '0.8rem' }}>
                    v{version} • {gameVersion} Edition
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationModal
                isOpen={!!pendingFile}
                onClose={() => setPendingFile(null)}
                onConfirm={executeImport}
                title={t('ui.confirm_restore', 'Restore Backup?')}
                message={t('messages.confirm_import', 'This will overwrite your current data. This action cannot be undone.')}
                confirmText={t('ui.restore', 'Restore')}
                cancelText={t('ui.cancel', 'Cancel')}
                isDangerous={true}
            />
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
