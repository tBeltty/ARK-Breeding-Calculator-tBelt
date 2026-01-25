import { useState, useCallback } from 'react';

/**
 * useToast Hook
 * Manages toast notifications state.
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => {
            const next = [...prev, { id, message, type }];
            if (next.length > 5) return next.slice(next.length - 5);
            return next;
        });
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}
