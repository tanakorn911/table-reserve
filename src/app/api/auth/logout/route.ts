import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Initialize Supabase client
        // เริ่มต้นการเชื่อมต่อ Supabase
        const supabase = await createServerSupabaseClient();

        // Sign out the user
        // ลงชื่อออกจากระบบ
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
