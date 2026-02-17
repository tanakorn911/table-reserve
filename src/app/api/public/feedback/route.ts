import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/public/feedback
 * 
 * ดึงข้อมูลความคิดเห็นของลูกค้า (Testimonials) สำหรับแสดงในหน้า Landing Page
 * - กรองเฉพาะที่มีคะแนน 4-5 ดาว
 * - ปิดบังชื่อลูกค้าเพื่อความเป็นส่วนตัว
 * - เรียงลำดับจากใหม่ล่าสุด
 */
/**
 * GET /api/public/feedback
 * 
 * ดึงข้อมูลความคิดเห็นของลูกค้า (Testimonials) สำหรับแสดงในหน้า Landing Page
 * - กรองเฉพาะที่มีคะแนน 4-5 ดาว
 * - ปิดบังชื่อลูกค้าเพื่อความเป็นส่วนตัว (Masking)
 * - เรียงลำดับจากใหม่ล่าสุด
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // เชื่อมต่อ Supabase โดยใช้สิทธิ์ Server Side
        const supabase = await createServerSupabaseClient();

        // ดึงเฉพาะข้อมูลที่จำเป็นและมีคะแนน 4 ดาวขึ้นไป เพื่อนำมาแสดงเป็นรีวิวหน้าเว็บบอร์ด
        const { data: feedbacks, error } = await supabase
            .from('feedback')
            .select('id, rating, comment, customer_name, created_at')
            .gte('rating', 4)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Public Feedback API Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // ฟังก์ชันสำหรับ Masking ชื่อลูกค้า (เช่น "John Doe" -> "Jo*** Do***")
        // เพื่อความเป็นส่วนตัวขั้นสูงสุด ข้อมูลชื่อเต็มจะไม่ถูกส่งออกไปยังหน้าบ้าน (Public)
        const maskName = (name: string) => {
            const parts = name.trim().split(/\s+/);
            const mask = (str: string) => {
                if (str.length <= 1) return str + '***';
                if (str.length <= 2) return str.substring(0, 1) + '***';
                return str.substring(0, 2) + '***';
            };

            if (parts.length > 1) {
                return parts.map(mask).join(' ');
            }
            return mask(name);
        };

        // ประมวลผลข้อมูลรีวิวเพื่อ Mask ชื่อก่อนส่งกลับ
        const processedFeedbacks = (feedbacks || []).map(item => ({
            ...item,
            customer_name: item.customer_name ? maskName(item.customer_name) : 'Guest'
        }));

        return NextResponse.json({
            success: true,
            data: processedFeedbacks
        });
    } catch (error) {
        console.error('Public Feedback API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
