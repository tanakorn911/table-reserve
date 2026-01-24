import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code || code.length < 4) {
            return NextResponse.json({ error: 'กรุณากรอกรหัสการจองให้ถูกต้อง' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const cleanCode = code.trim().toUpperCase();

        // New search: exact match on booking_code OR phone number
        const { data, error } = await supabase
            .from('reservations')
            .select('id, guest_name, reservation_date, reservation_time, status, party_size, table_number, guest_phone, booking_code')
            .or(`booking_code.eq.${cleanCode},guest_phone.eq.${cleanCode}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

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
