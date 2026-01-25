import React from 'react';
import { Modal } from '../Modal';
import styles from './NotificationConfigModal.module.css';
import { useTranslation } from 'react-i18next';

export function NotificationConfigModal({
    isOpen,
    onClose,
    leadTime,
    onLeadTimeChange,
    onConfirm,
    currentBufferTime
}) {
    const { t } = useTranslation();

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('notifications.configure_title', 'Configure Notification')}
        >
            <div className={styles.content}>
                <p className={styles.description}>
                    {t('notifications.configure_desc', 'Set a lead time to be notified before the trough is empty.')}
                </p>

                <div className={styles.infoRow}>
                    <span className={styles.label}>{t('fields.current_buffer')}:</span>
                    <span className={styles.value}>{currentBufferTime}</span>
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                        {t('fields.notify_buffer_time', 'Notify before (mins)')}
                    </label>
                    <input
                        type="number"
                        className={styles.input}
                        value={leadTime}
                        onChange={(e) => onLeadTimeChange(Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        min="1"
                        max="60"
                        autoFocus
                    />
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        {t('ui.cancel', 'Cancel')}
                    </button>
                    <button className={styles.confirmBtn} onClick={handleConfirm}>
                        {t('ui.set_notification', 'Set Notification')} 🔔
                    </button>
                </div>
            </div>
        </Modal>
    );
}
