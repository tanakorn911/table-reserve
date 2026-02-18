import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/ratelimit';

/**
 * Change Password for Currently Logged-in User
 * This endpoint allows users to change their own password without being logged out
 * API สำหรับเปลี่ยนรหัสผ่านของผู้ใช้ที่ล็อกอินอยู่
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get current user
        // ดึงข้อมูลผู้ใช้ปัจจุบัน
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🔒 Admin Only - Only admins can change passwords
        // 🔒 ตรวจสอบสิทธิ์ - เฉพาะ Admin เท่านั้นที่เปลี่ยนรหัสผ่านได้ (ตาม Logic เดิม)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({
                error: 'Forbidden - Admin access required'
            }, { status: 403 });
        }

        const { currentPassword, newPassword } = await request.json();

        // Validate inputs
        // ตรวจสอบข้อมูลที่ส่งมา
        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                error: 'Current password and new password are required'
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({
                error: 'New password must be at least 6 characters'
            }, { status: 400 });
        }

        // Verify current password by attempting to sign in
        // ยืนยันรหัสผ่านปัจจุบันโดยการลองล็อกอิน
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
        });

        if (signInError) {
            return NextResponse.json({
                error: 'Current password is incorrect'
            }, { status: 401 });
        }

        // Update password using the user's own session
        // อัปเดตรหัสผ่านใหม่
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            console.error('Password update error:', updateError);
            return NextResponse.json({
                error: updateError.message
            }, { status: 400 });
        }

        // 📝 Audit Log: Change Password
        try {
            const clientIp = getClientIp(request);
            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action: 'change_password',
                entity: 'auth.users',
                entity_id: user.id,
                payload: { email: user.email },
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            message: 'Password changed successfully. You will remain logged in.'
        });

    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
