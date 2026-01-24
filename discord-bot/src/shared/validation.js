/**
 * Input Validation Utilities
 * 
 * Sanitizes and validates user input to prevent abuse.
 */

/**
 * Validate and sanitize creature name
 */
export function validateCreatureName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Creature name is required' };
    }

    // Max 50 characters
    if (name.length > 50) {
        return { valid: false, error: 'Creature name must be 50 characters or less' };
    }

    // Only allow alphanumeric, spaces, and common characters
    const sanitized = name.replace(/[^a-zA-Z0-9\s\-_']/g, '').trim();

    if (sanitized.length === 0) {
        return { valid: false, error: 'Invalid creature name' };
    }

    return { valid: true, value: sanitized };
}

/**
 * Validate nickname
 */
export function validateNickname(nickname) {
    if (!nickname) {
        return { valid: true, value: null }; // Nickname is optional
    }

    if (nickname.length > 30) {
        return { valid: false, error: 'Nickname must be 30 characters or less' };
    }

    const sanitized = nickname.replace(/[^a-zA-Z0-9\s\-_']/g, '').trim();

    return { valid: true, value: sanitized || null };
}

/**
 * Validate server rates (multiplier)
 */
export function validateRates(rates) {
    const num = parseFloat(rates);

    if (isNaN(num) || num < 0.1 || num > 100) {
        return { valid: false, error: 'Rates must be between 0.1 and 100' };
    }

    return { valid: true, value: num };
}

/**
 * Validate Discord snowflake ID
 */
export function validateSnowflake(id) {
    if (!id || typeof id !== 'string') {
        return { valid: false, error: 'Invalid ID' };
    }

    // Discord snowflakes are 17-20 digit numbers
    if (!/^\d{17,20}$/.test(id)) {
        return { valid: false, error: 'Invalid Discord ID format' };
    }

    return { valid: true, value: id };
}
