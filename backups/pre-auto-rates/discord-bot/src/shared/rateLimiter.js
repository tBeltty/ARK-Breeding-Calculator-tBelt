/**
 * Rate Limiter
 * 
 * In-memory rate limiting for abuse prevention.
 * Simple sliding window implementation.
 */

// In-memory store (could be replaced with Redis for multi-instance)
const rateLimits = new Map();

/**
 * Check if a key is rate limited
 * @param {string} key - Unique identifier (e.g., 'user:123' or 'guild:456')
 * @param {object} options - Rate limit options
 * @returns {boolean} - True if rate limited, false if allowed
 */
export function checkRateLimit(key, options = {}) {
    const { maxRequests = 30, windowMs = 60000 } = options;
    const now = Date.now();

    let record = rateLimits.get(key);

    if (!record || now - record.windowStart >= windowMs) {
        // New window
        record = { count: 1, windowStart: now };
        rateLimits.set(key, record);
        return false;
    }

    record.count++;

    if (record.count > maxRequests) {
        return true; // Rate limited
    }

    return false;
}

/**
 * Clean up old rate limit records (call periodically)
 */
export function cleanupRateLimits() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [key, record] of rateLimits.entries()) {
        if (now - record.windowStart >= maxAge) {
            rateLimits.delete(key);
        }
    }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupRateLimits, 300000);
