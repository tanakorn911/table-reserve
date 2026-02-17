/**
 * Supabase Retry Helper
 * 
 * ฟังก์ชันช่วย retry สำหรับ Supabase query ที่อาจ timeout
 * ใช้ exponential backoff เพื่อลดโหลดเมื่อ connection มีปัญหา
 */

interface RetryOptions {
    maxRetries?: number;    // จำนวนครั้งที่ retry สูงสุด (default: 2)
    baseDelayMs?: number;   // เวลารอเริ่มต้น (default: 500ms)
}

/**
 * ครอบ async function ด้วย retry logic
 * ถ้า function throw error จะลองใหม่ตาม maxRetries
 * แต่ละครั้งจะรอนานขึ้นเป็น exponential (500ms, 1000ms, ...)
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const { maxRetries = 2, baseDelayMs = 500 } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}
