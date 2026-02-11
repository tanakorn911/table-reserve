import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple in-memory cache
// แคชแบบง่ายในหน่วยความจำเพื่อลดการเรียก API ซ้ำซ้อน
interface CacheEntry {
    insight: string;
    stats: any;
    generatedAt: string;
    date: string;
    locale: string;
}

let insightsCache: CacheEntry | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (ระยะเวลาแคช 15 นาที)

export async function GET(request: NextRequest) {
    try {
        // Check if Gemini API key is available
        // ตรวจสอบว่ามี API Key ของ Gemini หรือไม่
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Gemini API Key is not configured' },
                { status: 500 }
            );
        }

        // Get date and locale from query params
        // ดึงวันที่และภาษาจาก query parameters
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        const locale = searchParams.get('locale') || 'th';

        // Calculate Thailand time
        // คำนวณเวลาประเทศไทย
        const now = new Date();
        const thailandOffset = 7 * 60;
        const localOffset = now.getTimezoneOffset();
        const thailandTime = new Date(now.getTime() + (thailandOffset + localOffset) * 60000);

        const today = dateParam || thailandTime.toISOString().split('T')[0];
        const yesterday = new Date(thailandTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Check cache
        // ตรวจสอบแคชก่อน ถ้ามีและยังไม่หมดอายุ ให้ใช้ข้อมูลจากแคช
        if (
            insightsCache &&
            insightsCache.date === today &&
            insightsCache.locale === locale &&
            (Date.now() - new Date(insightsCache.generatedAt).getTime() < CACHE_DURATION)
        ) {
            return NextResponse.json({
                success: true,
                data: {
                    insight: insightsCache.insight,
                    stats: insightsCache.stats,
                    generatedAt: insightsCache.generatedAt,
                }
            });
        }

        // Initialize Supabase
        // เริ่มต้นการเชื่อมต่อ Supabase
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch today's reservations
        // ดึงข้อมูลการจองของวันนี้
        const { data: todayReservations, error: todayError } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', today);

        if (todayError) throw todayError;

        // Fetch yesterday's reservations for comparison
        // ดึงข้อมูลการจองของเมื่อวานเพื่อเปรียบเทียบ
        const { data: yesterdayReservations, error: yesterdayError } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', yesterday);

        if (yesterdayError) throw yesterdayError;

        // Calculate statistics
        // คำนวณสถิติต่างๆ
        const stats = {
            today: {
                total: todayReservations?.length || 0,
                confirmed: todayReservations?.filter(r => r.status === 'confirmed').length || 0,
                pending: todayReservations?.filter(r => r.status === 'pending').length || 0,
                cancelled: todayReservations?.filter(r => r.status === 'cancelled').length || 0,
                totalGuests: todayReservations?.reduce((sum, r) => sum + (r.party_size || 0), 0) || 0,
            },
            yesterday: {
                total: yesterdayReservations?.length || 0,
                confirmed: yesterdayReservations?.filter(r => r.status === 'confirmed').length || 0,
                totalGuests: yesterdayReservations?.reduce((sum, r) => sum + (r.party_size || 0), 0) || 0,
            },
        };

        // Calculate peak hours
        // คำนวณช่วงเวลาที่มีลูกค้ามากที่สุด
        const hourCounts: Record<number, number> = {};
        todayReservations?.forEach(r => {
            if (r.reservation_time) {
                const hour = parseInt(r.reservation_time.split(':')[0]);
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });
        const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

        // Generate AI insight using Gemini
        // สร้างบทวิเคราะห์ด้วย AI (Gemini)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        let prompt;

        if (locale === 'en') {
            prompt = `
You are an AI assistant for a restaurant reservation system. Please create a short summary (2-3 sentences) in English based on the statistics below.

📊 Today's Stats (${today}):
- Total bookings: ${stats.today.total}
- Confirmed: ${stats.today.confirmed}
- Pending: ${stats.today.pending}
- Cancelled: ${stats.today.cancelled}
- Expected guests: ${stats.today.totalGuests}
- Peak hour: ${peakHour ? `${peakHour[0]}:00 (${peakHour[1]} bookings)` : 'No data'}

📈 Comparison with Yesterday (${yesterday}):
- Total bookings yesterday: ${stats.yesterday.total}
- Total guests yesterday: ${stats.yesterday.totalGuests}

Please provide a friendly, interesting short summary with appropriate emojis. Do not use markdown or bullet points.
`;
        } else {
            prompt = `
คุณเป็นผู้ช่วย AI สำหรับระบบจองโต๊ะร้านอาหาร โปรดสร้างข้อความสรุปสั้นๆ (2-3 ประโยค) เป็นภาษาไทย จากสถิติด้านล่างนี้

📊 สถิติวันนี้ (${today}):
- การจองทั้งหมด: ${stats.today.total} รายการ
- ยืนยันแล้ว: ${stats.today.confirmed} รายการ
- รอดำเนินการ: ${stats.today.pending} รายการ
- ยกเลิก: ${stats.today.cancelled} รายการ
- ลูกค้าที่คาดว่าจะมา: ${stats.today.totalGuests} คน
- ช่วงเวลาที่มีการจองมากที่สุด: ${peakHour ? `${peakHour[0]}:00 น. (${peakHour[1]} รายการ)` : 'ไม่มีข้อมูล'}

📈 เปรียบเทียบกับเมื่อวาน (${yesterday}):
- การจองเมื่อวาน: ${stats.yesterday.total} รายการ
- ลูกค้าเมื่อวาน: ${stats.yesterday.totalGuests} คน

กรุณาตอบเป็นข้อความสรุปสั้นๆ ที่เป็นมิตรและน่าสนใจ พร้อม emoji ที่เหมาะสม ห้ามใช้ markdown หรือ bullet points
`;
        }

        try {
            // Helper for delay
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            // Retry logic with backoff
            // ระบบลองใหม่เมื่อเกิดข้อผิดพลาด (Retry Logic) พร้อมเพิ่มเวลาหน่วง
            const generateWithRetry = async (retries = 3, delayMs = 1000) => {
                try {
                    return await model.generateContent(prompt);
                } catch (error: any) {
                    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
                        console.log(`Rate limit hit, retrying in ${delayMs}ms... (${retries} retries left)`);
                        await delay(delayMs);
                        return generateWithRetry(retries - 1, delayMs * 2);
                    }
                    throw error;
                }
            };

            const result = await generateWithRetry();
            const insight = result.response.text().trim();

            // Update cache
            // อัปเดตแคชด้วยข้อมูลใหม่
            insightsCache = {
                insight,
                stats,
                generatedAt: new Date().toISOString(),
                date: today,
                locale
            };

            return NextResponse.json({
                success: true,
                data: {
                    insight,
                    stats,
                    generatedAt: insightsCache.generatedAt,
                }
            });

        } catch (error: any) {
            // Handle Rate Limit gracefully by returning stats without AI text
            // กรณี AI มีปัญหา (เช่น Rate Limit) ให้ส่งคืนสถิติโดยไม่มีข้อความ AI
            if (error.message?.includes('429') || error.status === 429) {
                console.warn('Gemini Rate Limit hit after retries. Returning fallback stats.');
                const fallbackInsight = locale === 'en'
                    ? "AI is currently experimenting high traffic. Here are your latest stats:"
                    : "ขณะนี้มีผู้ใช้งาน AI จำนวนมาก โปรดดูสถิติล่าสุดของคุณได้ที่นี่:";

                return NextResponse.json({
                    success: true,
                    data: {
                        insight: fallbackInsight,
                        stats,
                        generatedAt: new Date().toISOString(),
                    }
                });
            }
            throw error; // Re-throw other errors to be caught by outer catch
        }

    } catch (error: any) {
        console.error('AI Insights error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate insights' },
            { status: 500 }
        );
    }
}
