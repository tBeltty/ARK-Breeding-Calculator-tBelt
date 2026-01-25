import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NotificationManager } from '../infrastructure/NotificationManager';

export function useNotification(addToast) {
    const { t } = useTranslation();
    const [notifyEnabled, setNotifyEnabled] = useState(() => localStorage.getItem('notifyEnabled') === 'true');
    const [notifyTime, setNotifyTime] = useState(10);
    const isNotifyProcessingRef = useRef(false);

    useEffect(() => {
        localStorage.setItem('notifyEnabled', notifyEnabled);
    }, [notifyEnabled]);

    const handleNotifyToggle = async () => {
        if (isNotifyProcessingRef.current) return;
        isNotifyProcessingRef.current = true;
        try {
            if (!notifyEnabled) {
                const granted = await NotificationManager.requestPermission();
                if (granted) {
                    setNotifyEnabled(true);
                    addToast(t('messages.notification_enabled'), 'success');
                } else {
                    if ('Notification' in window && Notification.permission === 'denied') {
                        addToast(t('notifications.perm_blocked_hint'), 'error', 5000);
                    } else {
                        addToast(t('notifications.perm_denied'), 'error');
                    }
                    setNotifyEnabled(false);
                }
            } else {
                setNotifyEnabled(false);
                addToast(t('messages.notification_disabled'), 'info');
            }
        } catch (error) {
            console.error('Notification toggle error:', error);
        } finally {
            setTimeout(() => {
                isNotifyProcessingRef.current = false;
            }, 1500);
        }
    };

    return {
        notifyEnabled,
        setNotifyEnabled,
        notifyTime,
        setNotifyTime,
        handleNotifyToggle
    };
}
