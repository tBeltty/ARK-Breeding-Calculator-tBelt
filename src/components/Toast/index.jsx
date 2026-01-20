import { useState, useEffect, useCallback } from 'react';
import styles from './Toast.module.css';

/**
 * Toast Notification Component
 * 
 * Usage:
 * const { addToast, ToastContainer } = useToast();
 * ...
 * addToast('Operation successful', 'success');
 * return <ToastContainer />
 */

export function Toast({ id, message, type = 'info', onClose }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        // Wait for animation
        setTimeout(() => {
            onClose(id);
        }, 300);
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ️',
        warning: '⚠️'
    };

    return (
        <div
            className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}
            style={isExiting ? { animation: `${styles.slideOut} 0.3s forwards` } : {}}
            role="alert"
        >
            <span className={styles.icon}>{icons[type]}</span>
            <span className={styles.message}>{message}</span>
            <button className={styles.closeParams} onClick={handleClose}>×</button>
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const ToastContainer = () => (
        <div className={styles.toastContainer}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={removeToast}
                />
            ))}
        </div>
    );

    return { addToast, ToastContainer };
}
