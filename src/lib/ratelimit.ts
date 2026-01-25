import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client (will use memory if UPSTASH not configured)
let redis: Redis | null = null;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
} catch (error) {
    console.warn('Upstash Redis not configured, rate limiting disabled');
}

// Create rate limiters with different limits
export const reservationRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
        analytics: true,
        prefix: 'ratelimit:reservation',
    })
    : null;

export const checkBookingRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 requests per hour
        analytics: true,
        prefix: 'ratelimit:check',
    })
    : null;

export const settingsRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour (authenticated)
        analytics: true,
        prefix: 'ratelimit:settings',
    })
    : null;

// Helper to get client IP
export function getClientIp(request: Request): string {
    // Try to get real IP from headers (for proxies like Vercel)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    return 'unknown';
}

// Helper function to apply rate limiting
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
    if (!limiter) {
        // If rate limiter not configured, allow request
        return { success: true };
    }

    try {
        const result = await limiter.limit(identifier);

        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
        };
    } catch (error) {
        console.error('Rate limit service error:', error);
        // Fail-safe: Allow request if rate limiter fails
        return { success: true };
    }
}
