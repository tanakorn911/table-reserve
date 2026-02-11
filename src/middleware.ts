import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware สำหรับจัดการ Request ทั้งหมดที่เข้ามายัง Server
 * ทำหน้าที่ตรวจสอบสิทธิ์ (Authentication & Authorization) และจัดการ Cookie
 */
export async function middleware(request: NextRequest) {
    // สร้าง Response แบื้องต้นเพื่อใช้จัดการ Header และ Cookie
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // สร้าง Supabase Client สำหรับฝั่ง Server เพื่อตรวจสอบ Session ผู้ใช้
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, // URL ของ Supabase Project
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Key สำหรับ Anonymous (Public)
        {
            cookies: {
                // ฟังก์ชันสำหรับอ่าน Cookie ทั้งหมด
                getAll() {
                    return request.cookies.getAll();
                },
                // ฟังก์ชันสำหรับเขียน Cookie ทั้งหมด (จัดการทั้ง Request และ Response)
                setAll(cookiesToSet) {
                    // วนลูปตั้งค่า Cookie ใน Request
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    // อัปเดต Response object
                    response = NextResponse.next({
                        request,
                    });
                    // วนลูปตั้งค่า Cookie ใน Response
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // ดึงข้อมูลผู้ใช้ปัจจุบันจาก Supabase Auth
    // ใช้ getUser() เพื่อความปลอดภัยกว่า getSession() ในฝั่ง Server
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // --- ส่วนการป้องกันเส้นทาง (Route Protection) ---

    // 1. การป้องกันหน้า Admin (Admin Pages Protection)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // หากเข้าหน้า Login
        if (request.nextUrl.pathname === '/admin/login') {
            // ถ้ามี User ล็อกอินอยู่แล้ว ให้เด้งไปหน้า Dashboard เลย
            if (user) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            // ถ้ายังไม่ล็อกอิน ก็ให้เข้าหน้า Login ได้ตามปกติ
            return response;
        }

        // หากเข้าหน้า Admin อื่นๆ แล้วยังไม่ล็อกอิน
        if (!user) {
            // ให้เด้งกลับไปหน้า Login
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // --- การควบคุมสิทธิ์ตามบทบาท (RBAC - Role-Based Access Control) ---
        // ดึง role จาก metadata ของ user, ถ้าไม่มีให้ถือว่าเป็น admin ไปก่อน
        const role = user.user_metadata?.role || 'admin';
        // รายชื่อเส้นทางที่ต้องห้ามสำหรับ Staff
        const restrictedPaths = ['/admin/tables', '/admin/settings'];

        // ถ้าเป็น Staff และพยายามเข้าหน้าที่ห้ามเข้า
        if (
            role === 'staff' &&
            restrictedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
        ) {
            // ให้เด้งกลับไปหน้า Dashboard แทน
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    // 2. การป้องกัน API (API Protection)
    const isApi = request.nextUrl.pathname.startsWith('/api');
    if (isApi) {
        const method = request.method; // ดึง HTTP Method (GET, POST, PUT, DELETE)
        const path = request.nextUrl.pathname; // ดึง Path
        const role = user?.user_metadata?.role || 'admin'; // ดึง Role
        const isWrite = ['POST', 'PUT', 'DELETE'].includes(method); // ตรวจสอบว่าเป็นคำสั่งแก้ไขข้อมูลหรือไม่

        // อนุญาต: POST /api/reservations (สาธารณะ - สำหรับลูกค้าจองโต๊ะ)
        if (path === '/api/reservations' && method === 'POST') {
            return response;
        }

        // อนุญาต: POST /api/timeslots (สาธารณะ - สำหรับตรวจสอบ/จองสล็อตเวลา)
        if (path === '/api/timeslots') {
            return response;
        }

        // อนุญาต: POST /api/ai/recommend-table (สาธารณะ - AI แนะนำโต๊ะ)
        if (path === '/api/ai/recommend-table') {
            return response;
        }

        // บล็อกการแก้ไขข้อมูลทั้งหมดหากไม่ได้ล็อกอิน (ยกเว้นข้อยกเว้นด้านบน)
        if (isWrite && !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // บล็อก Staff จากการแก้ไขข้อมูลที่สำคัญ
        if (role === 'staff' && isWrite) {
            // Staff อนุญาตให้แก้ไขการจองได้ (เช่น ยืนยัน, ยกเลิก)
            if (path.startsWith('/api/reservations') && (method === 'PUT' || method === 'POST')) {
                return response;
            }
            // Staff ห้ามแก้ไขโต๊ะ หรือ การตั้งค่าร้าน
            if (path.startsWith('/api/tables') || path.startsWith('/api/settings')) {
                return NextResponse.json({ error: 'Permission Denied: Admin only' }, { status: 403 });
            }
        }
    }

    // หากไม่มีเงื่อนไขใดขัดข้อง ให้ดำเนินการต่อตามปกติ
    return response;
}

// การตั้งค่า Config สำหรับ Middleware
export const config = {
    matcher: [
        /*
         * กำหนด Path ที่จะให้ Middleware ทำงาน
         * Match ทุก Path ยกเว้น:
         * - _next/static (ไฟล์ Static ของ Next.js)
         * - _next/image (ไฟล์รูปภาพที่ผ่านการ Optimize)
         * - favicon.ico (ไอคอนเว็บไซต์)
         * - รูปภาพต่างๆ .svg, .png, .jpg, .jpeg, .gif, .webp
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
