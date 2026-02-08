import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        // Get date from query params or use today
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // Calculate Thailand time
        const now = new Date();
        const thailandOffset = 7 * 60;
        const localOffset = now.getTimezoneOffset();
        const thailandTime = new Date(now.getTime() + (thailandOffset + localOffset) * 60000);

        const today = dateParam || thailandTime.toISOString().split('T')[0];
        const yesterday = new Date(thailandTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
            // Return mock insights if no API key
            return NextResponse.json({
                success: true,
                data: {
                    insight: generateMockInsight(stats, peakHour),
                    stats,
                    generatedAt: new Date().toISOString(),
                }
            });
        }

        // Generate AI insight using Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
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

        const result = await model.generateContent(prompt);
        const insight = result.response.text();

        return NextResponse.json({
            success: true,
            data: {
                insight: insight.trim(),
                stats,
                generatedAt: new Date().toISOString(),
            }
        });

    } catch (error) {
        console.error('AI Insights error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate insights',
                data: {
                    insight: '📊 ไม่สามารถสร้างสรุปได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
                    stats: null,
                    generatedAt: new Date().toISOString(),
                }
            },
            { status: 500 }
        );
    }
}

// Mock insight generator when no API key
function generateMockInsight(stats: any, peakHour: [string, number] | undefined): string {
    const change = stats.today.total - stats.yesterday.total;
    const changeText = change > 0
        ? `เพิ่มขึ้น ${change} รายการ`
        : change < 0
            ? `ลดลง ${Math.abs(change)} รายการ`
            : 'เท่ากับเมื่อวาน';

    if (stats.today.total === 0) {
        return '📭 วันนี้ยังไม่มีการจองเข้ามา รอลูกค้าใหม่กันนะครับ!';
    }

    return `🎯 วันนี้มีการจอง ${stats.today.total} รายการ ${changeText} คาดว่าจะมีลูกค้า ${stats.today.totalGuests} คน ${peakHour ? `ช่วงเวลา ${peakHour[0]}:00 น. คึกคักที่สุด!` : ''} 💪`;
}
