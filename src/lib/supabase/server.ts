import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side Supabase client (สำหรับใช้งานใน Server Components, API Routes, Server Actions)
// จำเป็นต้องมีการจัดการ Cookies เพื่อยืนยันตัวตน (Authentication)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // กรณีเรียกใช้จาก Server Component อาจจะไม่สามารถ Set Cookie ได้โดยตรง
          // แต่ปกติจะมี Middleware จัดการเรื่อง Refresh Session ให้อยู่แล้ว
        }
      },
    },
  });
}
