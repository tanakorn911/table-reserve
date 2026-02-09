import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple in-memory cache
interface CacheEntry {
    insight: string;
    stats: any;
    generatedAt: string;
    date: string;
    locale: string;
}

let insightsCache: CacheEntry | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
    try {
        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Gemini API Key is not configured' },
                { status: 500 }
            );
        }

        // Get date and locale from query params
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        const locale = searchParams.get('locale') || 'th';

        // Calculate Thailand time
        const now = new Date();
        const thailandOffset = 7 * 60;
        const localOffset = now.getTimezoneOffset();
        const thailandTime = new Date(now.getTime() + (thailandOffset + localOffset) * 60000);

        const today = dateParam || thailandTime.toISOString().split('T')[0];
        const yesterday = new Date(thailandTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Check cache
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
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch today's reservations
        const { data: todayReservations, error: todayError } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', today);

        if (todayError) throw todayError;

        // Fetch yesterday's reservations for comparison
        const { data: yesterdayReservations, error: yesterdayError } = await supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', yesterday);

        if (yesterdayError) throw yesterdayError;

        // Calculate statistics
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
        const hourCounts: Record<number, number> = {};
        todayReservations?.forEach(r => {
            if (r.reservation_time) {
                const hour = parseInt(r.reservation_time.split(':')[0]);
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });
        const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

        // Generate AI insight using Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Models to try in order
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];

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

            // Recursive function to try models with retry logic
            const generateWithFallback = async (modelIndex = 0, retryCount = 0): Promise<string> => {
                const modelName = modelsToTry[modelIndex];

                // If we ran out of models, throw error to trigger fallback
                if (!modelName) {
                    throw new Error('All AI models failed');
                }

                try {
                    console.log(`Attempting to generate with model: ${modelName} (Retry: ${retryCount})`);
                    const modelInstance = genAI.getGenerativeModel({ model: modelName });
                    const result = await modelInstance.generateContent(prompt);
                    return result.response.text().trim();
                } catch (error: any) {
                    const isRateLimit = error.message?.includes('429') || error.status === 429;
                    const isQuotaExceeded = error.message?.includes('quota') || error.message?.includes('limit');

                    // If Rate Limit/Quota issue
                    if (isRateLimit || isQuotaExceeded) {
                        console.warn(`Model ${modelName} hit rate limit/quota.`);

                        // If we can still retry this model (up to 1 time for transient errors), do it
                        // But mostly for rate limits we want to switch models fast if it persists
                        if (retryCount < 1) {
                            await delay(1000); // Wait 1s
                            return generateWithFallback(modelIndex, retryCount + 1);
                        }

                        // Move to next model
                        return generateWithFallback(modelIndex + 1, 0);
                    }

                    // For other errors, also try next model just in case
                    console.error(`Model ${modelName} error:`, error.message);
                    return generateWithFallback(modelIndex + 1, 0);
                }
            };

            const insight = await generateWithFallback();

            // Update cache
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
