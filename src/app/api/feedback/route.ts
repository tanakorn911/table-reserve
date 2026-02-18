import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { reservationRateLimiter, checkRateLimit, getClientIp } from '@/lib/ratelimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST: Submit Feedback
// POST: Submit Feedback
// POST: ส่งข้อมูล Feedback ลงฐานข้อมูล (มี Rate Limit)
export async function POST(request: NextRequest) {
    try {
        // ดึงข้อมูล IP ของผู้ใช้เพื่อตรวจสอบ Rate Limit ป้องกันการสแปม
        const clientIp = getClientIp(request);
        const rateLimitResult = await checkRateLimit(reservationRateLimiter, `feedback:${clientIp}`);

        // หากส่งคำขอถี่เกินไป (Rate Limit เกิน) จะส่ง Error 429 กลับไป
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        // อ่านข้อมูลจาก Body ของคำขอ
        const body = await request.json();
        const reservationId = body.reservationId || body.reservation_id;
        const rating = body.rating;
        const comment = body.comment;
        let name = body.name || body.customer_name;
        let phone = body.phone || body.customer_phone;

        // ตรวจสอบข้อมูลเบื้องต้นที่จำเป็น (ID การจอง และ คะแนน)
        if (!reservationId || !rating) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // เชื่อมต่อ Supabase โดยใช้ Service Key เพื่อให้มีสิทธิ์เขียนข้อมูล
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ดึงข้อมูลการจองต้นฉบับเพื่อเอาชื่อและเบอร์โทรที่บันทึกไว้ (ป้องกันกรณีข้อมูลหลุดหรือถูกแก้ไขจากหน้าบ้าน)
        const { data: reservation, error: resError } = await supabase
            .from('reservations')
            .select('guest_name, guest_phone')
            .eq('id', reservationId)
            .single();

        // หากไม่พบข้อมูลการจอง แจ้งเตือน 404
        if (resError || !reservation) {
            return NextResponse.json(
                { success: false, error: 'Reservation not found' },
                { status: 404 }
            );
        }

        // ใช้ค่าชื่อและเบอร์โทรที่ดึงจากฐานข้อมูลหาก Client ไม่ได้ส่งมาหรือส่งมาในรูปแบบที่ถูกเซนเซอร์ (*)
        if (!name || name.includes('*')) name = reservation.guest_name;
        if (!phone || phone.includes('*')) phone = reservation.guest_phone;

        // ตรวจสอบค่าคะแนนต้องอยู่ระหว่าง 1 ถึง 5 ดาว
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        // ตรวจสอบว่าเคยมีการส่ง Feedback สำหรับการจองนี้ไปแล้วหรือยัง (ไม่อนุญาตให้รีวิวซ้ำ)
        const { data: existing } = await supabase
            .from('feedback')
            .select('id')
            .eq('reservation_id', reservationId)
            .single();

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Feedback already submitted for this reservation' },
                { status: 409 }
            );
        }

        // บันทึกข้อมูล Feedback ลงในตาราง 'feedback'
        const { data, error } = await supabase
            .from('feedback')
            .insert([{
                reservation_id: reservationId,
                rating,
                comment: comment || null,
                customer_name: name || null,
                customer_phone: phone || null,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) {
            console.error('Feedback insert error:', error);
            throw error;
        }

        // 📝 Audit Log: Submit Feedback
        try {
            await supabase.from('audit_logs').insert([{
                user_id: null, // Feedback can be submitted by non-logged-in users
                action: 'submit_feedback',
                entity: 'feedback',
                entity_id: data.id,
                payload: { reservation_id: reservationId, rating, comment: comment || null, customer_name: name || null, customer_phone: phone || null },
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully',
            data,
        });

    } catch (error) {
        console.error('Feedback API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit feedback' },
            { status: 500 }
        );
    }
}

// GET: Fetch Feedback List (Admin Only)
// GET: ดึงรายการ Feedback ทั้งหมด (สำหรับ Admin — ต้อง Login ก่อน)
export async function GET(request: NextRequest) {
    try {
        // ตรวจสอบสิทธิ์ผู้ดูแลระบบ (ต้อง Login ผ่าน Supabase ค้างไว้)
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized — Admin login required' },
                { status: 401 }
            );
        }

        // อ่าน Parameter สำหรับการแบ่งหน้า (limit และ offset)
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ดึงข้อมูล Feedback พร้อมดึงข้อมูลสัมพันธ์จากการจอง (ชื่อลูกค้าและวันที่จอง)
        const { data, error, count } = await supabase
            .from('feedback')
            .select('*, reservations(guest_name, reservation_date)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        // คำนวณคะแนนเฉลี่ยจากข้อมูลทั้งหมดในระบบ เพื่อแสดงในหน้า Admin
        const { data: avgData } = await supabase
            .from('feedback')
            .select('rating');

        const avgRating = avgData && avgData.length > 0
            ? (avgData.reduce((sum, f) => sum + f.rating, 0) / avgData.length).toFixed(1)
            : null;

        return NextResponse.json({
            success: true,
            data,
            pagination: {
                total: count || 0,
                limit,
                offset,
            },
            stats: {
                averageRating: avgRating ? parseFloat(avgRating) : null,
                totalFeedback: count || 0,
            },
        });

    } catch (error) {
        console.error('Feedback GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch feedback' },
            { status: 500 }
        );
    }
}

// DELETE: Remove Feedback (Admin Only)
// DELETE: ลบ Feedback (สำหรับ Admin — ต้อง Login ก่อน)
export async function DELETE(request: NextRequest) {
    try {
        // ตรวจสอบสิทธิ์ Admin (ความปลอดภัยขั้นสูง)
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized — Admin login required' },
                { status: 401 }
            );
        }

        // อ่าน ID ของ Feedback ที่ต้องการลบจาก URL Parameter
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing feedback ID' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ดำเนินการลบข้อมูลตาม ID ที่ส่งมา
        const { error } = await supabase
            .from('feedback')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        // 📝 Audit Log: Delete Feedback
        try {
            const clientIp = getClientIp(request);
            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action: 'delete_feedback',
                entity: 'feedback',
                entity_id: id,
                payload: { id },
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Feedback DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete feedback' },
            { status: 500 }
        );
    }
}
