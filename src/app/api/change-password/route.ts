import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Change Password for Currently Logged-in User
 * This endpoint allows users to change their own password without being logged out
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🔒 Admin Only - Only admins can change passwords
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
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            console.error('Password update error:', updateError);
            return NextResponse.json({
                error: updateError.message
            }, { status: 400 });
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
