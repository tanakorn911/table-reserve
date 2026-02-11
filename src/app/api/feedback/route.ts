import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST: Submit Feedback
// POST: ส่งข้อมูล Feedback ลงฐานข้อมูล
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reservationId, rating, comment, name, phone } = body;

        // Validate required fields
        // ตรวจสอบข้อมูลจำเป็น
        if (!reservationId || !rating) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate rating
        // ตรวจสอบค่าคะแนน (ต้องอยู่ระหว่าง 1-5)
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if feedback already exists for this reservation
        // ตรวจสอบว่าเคยส่ง Feedback ไปแล้วหรือยัง
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

        // Insert feedback
        // บันทึกข้อมูล Feedback ลงฐานข้อมูล
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
            // If feedback table doesn't exist, create it implicitly through error handling
            console.error('Feedback insert error:', error);
            throw error;
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

// GET: Fetch Feedback List (Admin)
// GET: ดึงรายการ Feedback ทั้งหมด (สำหรับ Admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch feedback with pagination
        // ดึงข้อมูล Feedback พร้อมแบ่งหน้า (Pagination)
        const { data, error, count } = await supabase
            .from('feedback')
            .select('*, reservations(guest_name, reservation_date)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        // Calculate average rating
        // คำนวณคะแนนเฉลี่ย
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
