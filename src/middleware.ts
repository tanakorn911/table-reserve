import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware: ด่านหน้าสำหรับจัดการ Request ทั้งหมดของ Server
 * 
 * หน้าที่หลัก:
 * 1. 🔐 Authentication: ตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง (ผ่าน Supabase Auth)
 * 2. 🛡️ Security: ป้องกันไม่ให้เข้าถึงหน้า Admin หรือ API สำคัญโดยไม่ได้รับอนุญาต
 * 3. 🍪 Cookie Management: จัดการ Refresh Token ของ Supabase เพื่อให้ Session ไม่หมดอายุ
 * 4. 👮 Role-Based Access Control (RBAC): แยกสิทธิ์การเข้าถึงระหว่าง Admin (เจ้าของร้าน) กับ Staff (พนักงาน)
 */
export async function middleware(request: NextRequest) {
    // 1. เตรียม Response เริ่มต้น:
    // เราสร้าง Response ว่างๆ ขึ้นมาก่อน เพื่อให้สามารถจัดการ Header และ Cookie ได้ในภายหลัง
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // 2. สร้าง Supabase Client (Server-Side):
    // จำเป็นต้องสร้าง Client ใหม่ทุกครั้งที่ Request เข้ามา เพื่อความปลอดภัยและการจัดการ Cookie ที่ถูกต้อง
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // อ่าน Cookie ทั้งหมดจาก Request ที่ส่งมาจาก Browser
                getAll() {
                    return request.cookies.getAll();
                },
                // เขียน Cookie กลับไป (ใช้สำหรับ Update Session / Refresh Token)
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value); // ตั้งค่าใน Request ปัจจุบัน (เพื่อให้ backend อ่านได้ทันที)
                    });
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options); // ตั้งค่าใน Response ที่จะส่งกลับ Browser
                    });
                },
            },
        }
    );

    // 3. ตรวจสอบสถานะการล็อกอิน:
    // ดึงข้อมูล User จาก Supabase Auth (ปลอดภัยกว่าการเช็ค Cookie เอง เพราะมีการ verify signature)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ============================================
    // 🚦 Route Protection Rules (กฎการป้องกันเส้นทาง)
    // ============================================

    // กฎที่ 1: การเข้าถึงหน้า Admin Panel (`/admin/*`)
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // กรณี: เข้าหน้า Login (`/admin/login`)
        if (request.nextUrl.pathname === '/admin/login') {
            // ถ้ามี User ล็อกอินอยู่แล้ว -> ไม่ต้อง Login ซ้ำ ให้เด้งไป Dashboard เลย
            if (user) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            // ถ้ายังไม่ล็อกอิน -> อนุญาตให้เข้าหน้า Login ได้
            return response;
        }

        // กรณี: เข้าหน้า Admin อื่นๆ แต่ยังไม่ได้ล็อกอิน
        if (!user) {
            // ส่งกลับไปหน้า Login พร้อม Redirect กลับมาหน้านี้เมื่อล็อกอินสำเร็จ
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // --- Role-Based Access Control (RBAC) ---
        // ตรวจสอบสิทธิ์: Admin vs Staff
        const role = user.user_metadata?.role || 'admin'; // ค่า default คือ admin

        // หน้าที่ "Staff" (พนักงานทั่วไป) ห้ามเข้า
        const restrictedPathsForStaff = ['/admin/tables', '/admin/settings', '/admin/advertisements'];

        if (
            role === 'staff' &&
            restrictedPathsForStaff.some((path) => request.nextUrl.pathname.startsWith(path))
        ) {
            // ถ้า Staff พยายามเข้า -> เด้งกลับไป Dashboard
            console.warn(`Unauthorized Access: Staff attempted to access ${request.nextUrl.pathname}`);
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    // กฎที่ 2: การป้องกัน API Routes (`/api/*`)
    const isApi = request.nextUrl.pathname.startsWith('/api');
    if (isApi) {
        const method = request.method; // GET, POST, PUT, DELETE
        const path = request.nextUrl.pathname;
        const role = user?.user_metadata?.role || 'admin';

        // ตรวจสอบว่าเป็นคำสั่ง "เขียนข้อมูล" (Write Operation) หรือไม่?
        // GET = อ่าน (ปลอดภัยกว่า), POST/PUT/DELETE = แก้ไข (ต้องระวัง)
        const isWriteOperation = ['POST', 'PUT', 'DELETE'].includes(method);

        // --- ข้อยกเว้น: API สาธารณะ (Public APIs) ---
        // อนุญาตให้ใครก็ได้เรียกใช้โดยไม่ต้องล็อกอิน

        // 1. ลูกค้าสร้างการจองใหม่ (Booking)
        if (path === '/api/reservations' && method === 'POST') return response;

        // 2. เรียกดู Time Slots ที่ว่าง
        if (path === '/api/timeslots') return response;

        // 3. ขอคำแนะนำโต๊ะจาก AI
        if (path === '/api/ai/recommend-table') return response;

        // 4. ตรวจสอบสถานะการจอง (Check Booking Status)
        if (path.startsWith('/api/public')) return response;

        // --- กฎความปลอดภัยเข้มงวด ---

        // 1. ห้ามแก้ไขข้อมูล (Write) ถ้าไม่ได้ล็อกอิน
        if (isWriteOperation && !user) {
            return NextResponse.json({ error: 'Unauthorized: Please login first' }, { status: 401 });
        }

        // 2. จำกัดสิทธิ์ Staff (พนักงาน)
        if (role === 'staff' && isWriteOperation) {
            // Staff ทำอะไรได้บ้าง?
            // ✅ อนุญาต: จัดการการจอง (Confirm/Cancel/Check-in)
            if (path.startsWith('/api/reservations')) return response;

            // ✅ อนุญาต: จัดการ Feedback (ดูและลบรีวิวจากลูกค้า)
            if (path.startsWith('/api/feedback')) return response;

            // ❌ ห้าม: แก้ไขผังโต๊ะ, ตั้งค่าร้าน, หรือจัดการโฆษณา
            if (path.startsWith('/api/tables') || path.startsWith('/api/settings') || path.startsWith('/api/advertisements')) {
                return NextResponse.json({ error: 'Permission Denied: Admin role required' }, { status: 403 });
            }
        }
    }

    // ผ่านการตรวจสอบทั้งหมด -> อนุญาตให้ทำงานต่อ
    return response;
}

// Config: กำหนด Scope การทำงานของ Middleware
export const config = {
    matcher: [
        /*
         * Regex เพื่อบอกว่า Middleware นี้จะทำงานกับทุก Path ยกเว้น:
         * - /_next/static (ไฟล์ Static ของ Next.js)
         * - /_next/image (ไฟล์รูปภาพที่ผ่าน Image Optimization)
         * - /favicon.ico (Icon เว็บ)
         * - ไฟล์นามสกุล .svg, .png, .jpg, .jpeg, .gif, .webp
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
