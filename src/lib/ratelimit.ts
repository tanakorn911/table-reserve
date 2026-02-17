import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// สร้าง Redis client (ถ้าไม่มีค่า Config จะใช้ Memory แทนซึ่งไม่แนะนำสำหรับ Production)
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

// สร้าง Rate Limiters สำหรับการใช้งานต่างๆ

// 1. สำหรับการจอง (Reservation): จำกัด 10 ครั้งต่อชั่วโมง
export const reservationRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        analytics: true,
        prefix: 'ratelimit:reservation',
    })
    : null;

// 2. สำหรับการประเุภท "Check Status": จำกัด 20 ครั้งต่อชั่วโมง
export const checkBookingRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 h'),
        analytics: true,
        prefix: 'ratelimit:check',
    })
    : null;

// 3. สำหรับการตั้งค่า (Settings - Admin): จำกัด 100 ครั้งต่อชั่วโมง
export const settingsRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 h'),
        analytics: true,
        prefix: 'ratelimit:settings',
    })
    : null;

// ฟังก์ชันช่วยดึง IP ของผู้ใช้ (รองรับกรณีอยู่หลัง Proxy เช่น Vercel)
export function getClientIp(request: Request): string {
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

// ฟังก์ชันช่วยตรวจสอบ Rate Limit
// คืนค่า object ที่บอกว่าผ่านหรือไม่ (success) และเหลือโควต้าเท่าไหร่
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
    if (!limiter) {
        // ถ้าไม่มี Limiter (ไม่ได้ต่อ Redis) ให้ผ่านตลอด
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
    } catch (error: any) {
        // จัดการกรณี Error ของ Upstash (เช่น สิทธิ์ไม่พอรัน Lua script)
        if (error.message && (error.message.includes('NOPERM') || error.message.includes('evalsha'))) {
            console.warn('Rate Limit Warning: Redis user does not have permission to run Lua scripts (evalsha). Rate limiting skipped.');
        } else {
            console.error('Rate limit service error:', error);
        }

        // Fail-safe: ถ้าระบบ Rate Limit ล่ม ให้ยอมให้ผ่านไปก่อน (เพื่อไม่ให้กระทบผู้ใช้)
        return { success: true };
    }
}
