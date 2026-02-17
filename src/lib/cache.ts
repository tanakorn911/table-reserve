/**
 * Simple In-Memory Cache
 * 
 * แคชข้อมูลในหน่วยความจำเพื่อลดจำนวน request ไปยัง Supabase
 * เหมาะสำหรับข้อมูลที่ไม่เปลี่ยนแปลงบ่อย เช่น ads, settings, tables
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * ดึงข้อมูลจาก cache ถ้ายังไม่หมดอายุ
 * @param key - cache key
 * @param ttlMs - อายุ cache (milliseconds)
 * @returns ข้อมูลจาก cache หรือ null ถ้าหมดอายุ/ไม่มี
 */
export function getCache<T>(key: string, ttlMs: number): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

/**
 * บันทึกข้อมูลลง cache
 */
export function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

/**
 * ลบ cache ตาม key (ใช้เมื่อมีการ update ข้อมูล)
 */
export function invalidateCache(key: string): void {
    cache.delete(key);
}

/**
 * ลบ cache ทั้งหมดที่ขึ้นต้นด้วย prefix
 */
export function invalidateCacheByPrefix(prefix: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}
