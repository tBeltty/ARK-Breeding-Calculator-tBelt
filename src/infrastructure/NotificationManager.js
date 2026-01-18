/**
 * NotificationManager Infrastructure Service
 * Handles interaction with the Browser Notification API
 */

export const NotificationManager = {
    /**
     * Request permission to send notifications
     * @returns {Promise<boolean>} granted
     */
    requestPermission: async () => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    },

    /**
     * Check if permission is granted
     * @returns {boolean}
     */
    hasPermission: () => {
        return 'Notification' in window && Notification.permission === 'granted';
    },

    /**
     * Schedule a notification
     * @param {string} id - Unique identifier for the notification (to allow cancellation)
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {number} delayMs - Delay in milliseconds
     * @returns {number} timeoutId
     */
    schedule: (id, title, body, delayMs) => {
        // Cancel existing if any with same ID (simple implementation using a map would be better for a class, 
        // but for this module scope we can relying on the consumer to cancel)

        if (!NotificationManager.hasPermission()) return null;

        return setTimeout(() => {
            try {
                new Notification(title, {
                    body,
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png', // Android requires a badge (monochrome/mask)
                    requireInteraction: true // Keep it visible until user clicks
                });
            } catch (e) {
                console.error('Notification failed', e);
            }
        }, delayMs);
    },

    /**
     * Cancel a scheduled notification
     * @param {number} timeoutId 
     */
    cancel: (timeoutId) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};
