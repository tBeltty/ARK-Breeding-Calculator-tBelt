import { RateLimitService } from '../../../application/RateLimitService.js';

/**
 * Express Middleware for rate limiting
 * 
 * @param {number} limit Max requests
 * @param {number} windowSeconds Time window
 */
export const rateLimitMiddleware = (limit = 10, windowSeconds = 60) => {
    return async (req, res, next) => {
        // If user is authenticated via requireAuth, we use their Discord ID
        // Otherwise use IP (though not ideal for some proxies, but better than nothing)
        const key = req.user?.id ? `api:user:${req.user.id}` : `api:ip:${req.ip}`;

        const isAllowed = await RateLimitService.check(key, limit, windowSeconds);

        if (!isAllowed) {
            return res.status(429).json({
                error: 'Too many requests',
                message: `You are being rate limited. Please try again in ${windowSeconds} seconds.`
            });
        }

        next();
    };
};
