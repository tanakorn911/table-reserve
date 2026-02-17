import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkBookingRateLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

/**
 * Public API: Check Booking Status
 * Allows customers to check their reservation status using Booking Code or Phone Number
 * API สำหรับตรวจสอบสถานะการจอง (สำหรับลูกค้า) โดยใช้รหัสการจองหรือเบอร์โทรศัพท์
 */
export async function GET(request: NextRequest) {
    try {
        // 🔒 Rate limiting: 20 requests per hour per IP
        // 🔒 จำกัดการเรียกใช้งาน: 20 ครั้งต่อชั่วโมงต่อ IP เพื่อป้องกันการสุ่มเดา
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
        // 1. ลองค้นหาจากรหัสการจอง (Booking Code)
        let { data, error } = await supabase
            .from('reservations')
            .select('id, guest_name, reservation_date, reservation_time, status, party_size, table_number, guest_phone, booking_code')
            .eq('booking_code', cleanCode)
            .maybeSingle();

        // If not found, try phone number
        // 2. ถ้าไม่เจอ ลองค้นหาจากเบอร์โทรศัพท์ (เอาทรายการล่าสุด)
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
            return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง กรุณาตรวจสอบรหัส BX-xxxxxx' }, { status: 404 });
        }

        const reservationData: any = data;

        // Check for existing feedback
        const { data: feedbackData } = await supabase
            .from('feedback')
            .select('id')
            .eq('reservation_id', reservationData.id)
            .maybeSingle();

        reservationData.has_feedback = !!feedbackData;

        // Fetch table name if table_number exists
        // ดึงชื่อโต๊ะมาแสดง (ถ้ามี)
        if (reservationData.table_number) {
            const { data: tableData } = await supabase
                .from('tables')
                .select('name')
                .eq('id', reservationData.table_number)
                .single();

            if (tableData) {
                reservationData.table_name = tableData.name;
            }
        }

        // Basic masking for privacy
        // เซ็นเซอร์ชื่อลูกค้าบางส่วนเพื่อความเป็นส่วนตัว (เช่น "Somchai" -> "S******")
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
