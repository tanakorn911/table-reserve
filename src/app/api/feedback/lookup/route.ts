import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/feedback/lookup?code=BX-XXXXXX
 * Lookup reservation by booking code for feedback submission
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'กรุณาระบุรหัสการจอง' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // First try to find by booking_code column
        let reservation = null;

        // Try booking_code exact match
        const { data: byCode } = await supabase
            .from('reservations')
            .select('id, booking_code, guest_name, guest_phone, reservation_date, reservation_time, status')
            .eq('booking_code', code)
            .limit(1)
            .maybeSingle();

        if (byCode) {
            reservation = byCode;
        } else {
            // Try by ID prefix (for codes like BX-abc123)
            const idPrefix = code.replace(/^BX-/i, '');
            const { data: byId } = await supabase
                .from('reservations')
                .select('id, booking_code, guest_name, guest_phone, reservation_date, reservation_time, status')
                .ilike('id', `${idPrefix}%`)
                .limit(1)
                .maybeSingle();

            if (byId) {
                reservation = byId;
            } else {
                // Try exact ID match
                const { data: exactId } = await supabase
                    .from('reservations')
                    .select('id, booking_code, guest_name, guest_phone, reservation_date, reservation_time, status')
                    .eq('id', idPrefix)
                    .limit(1)
                    .maybeSingle();

                if (exactId) {
                    reservation = exactId;
                }
            }
        }

        if (!reservation) {
            return NextResponse.json(
                { success: false, error: 'ไม่พบรหัสการจองนี้ กรุณาตรวจสอบรหัสอีกครั้ง' },
                { status: 404 }
            );
        }

        // Check if feedback already exists
        const { data: existingFeedback } = await supabase
            .from('feedback')
            .select('id')
            .eq('reservation_id', reservation.id)
            .maybeSingle();

        if (existingFeedback) {
            return NextResponse.json(
                { success: false, error: 'คุณได้ให้คะแนนสำหรับการจองนี้แล้ว' },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            reservation,
        });

    } catch (error) {
        console.error('Feedback lookup error:', error);
        return NextResponse.json(
            { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
            { status: 500 }
        );
    }
}
