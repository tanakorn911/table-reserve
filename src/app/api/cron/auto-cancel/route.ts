import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Auto-Cancel Expired Reservations
 * This endpoint should be called by a cron job every 30 minutes
 * It cancels pending reservations that are older than 30 minutes
 * API สำหรับยกเลิกการจองที่ค้างสถานะ Pending เกิน 30 นาที (ทำงานผ่าน Cron Job)
 * 
 * ⚠️ ต้องส่ง Authorization: Bearer <CRON_SECRET> header มาด้วย
 */
export async function GET(request: NextRequest) {
    // ตรวจสอบ CRON_SECRET เพื่อป้องกันการเรียกจากภายนอก
    if (CRON_SECRET) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Calculate cutoff time (30 minutes ago)
        // คำนวณเวลาตัดรอบ (30 นาทีที่แล้ว)
        const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);

        // Find pending reservations older than 30 minutes
        // ค้นหาการจองที่สถานะ 'pending' และสร้างมานานกว่า 30 นาที
        const { data: expiredReservations, error: fetchError } = await supabase
            .from('reservations')
            .select('id, guest_name, booking_code, created_at')
            .eq('status', 'pending')
            .lt('created_at', cutoffTime.toISOString());

        if (fetchError) {
            throw fetchError;
        }

        if (!expiredReservations || expiredReservations.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No expired reservations to cancel',
                cancelled: 0,
            });
        }

        // Cancel each expired reservation
        // ไล่ยกเลิกการจองที่หมดอายุทีละรายการ
        const cancelledIds: string[] = [];
        for (const reservation of expiredReservations) {
            const { error: updateError } = await supabase
                .from('reservations')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', reservation.id);

            if (!updateError) {
                cancelledIds.push(reservation.id);
                console.log(`Auto-cancelled reservation: ${reservation.booking_code || reservation.id}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cancelled ${cancelledIds.length} expired reservations`,
            cancelled: cancelledIds.length,
            ids: cancelledIds,
        });

    } catch (error) {
        console.error('Auto-cancel error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process auto-cancel' },
            { status: 500 }
        );
    }
}
