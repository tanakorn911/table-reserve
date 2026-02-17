import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (สำหรับใช้งานใน Client Components)
// ใช้ createBrowserClient เพื่อให้สามารถเข้าถึง Cookie/Session ใน Browser ได้
export function createClientSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
