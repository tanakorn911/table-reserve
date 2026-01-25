import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkBookingRateLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
    try {
        // 🔒 Rate limiting: 20 requests per hour per IP
        const clientIp = getClientIp(request);
        const rateLimitResult = await checkRateLimit(checkBookingRateLimiter, clientIp);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code || code.length < 4) {
            return NextResponse.json({ error: 'กรุณากรอกรหัสการจองให้ถูกต้อง' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const cleanCode = code.trim().toUpperCase();

        // 🔒 SECURITY FIX: Separate queries to prevent SQL injection
        // First try booking code
        let { data, error } = await supabase
            .from('reservations')
            .select('id, guest_name, reservation_date, reservation_time, status, party_size, table_number, guest_phone, booking_code')
            .eq('booking_code', cleanCode)
            .maybeSingle();

        // If not found, try phone number
        if (!data && !error) {
            const phoneResult = await supabase
                .from('reservations')
                .select('id, guest_name, reservation_date, reservation_time, status, party_size, table_number, guest_phone, booking_code')
                .eq('guest_phone', cleanCode)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            data = phoneResult.data;
            error = phoneResult.error;
        }

        if (error || !data) {
            console.error('Search error:', error?.message);
            return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง กรุณาตรวจสอบรหัส BX- หรือเบอร์โทรศัพท์อีกครั้ง' }, { status: 404 });
        }

        const reservationData: any = data;

        // Basic masking for privacy
        const maskName = (name: string) => {
            const parts = name.split(' ');
            return parts.map(p => p[0] + '*'.repeat(Math.max(0, p.length - 1))).join(' ');
        };

        return NextResponse.json({
            data: {
                ...reservationData,
                guest_name: maskName(reservationData.guest_name),
                short_id: reservationData.booking_code || reservationData.id.slice(0, 8)
            }
        });

    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
    }
}
