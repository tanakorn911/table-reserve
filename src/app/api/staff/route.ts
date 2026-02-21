import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, reservationRateLimiter, getClientIp } from '@/lib/ratelimit';

// Create staff member (requires service role for auth.admin)
// POST: สร้างบัญชีพนักงานใหม่ (ต้องใช้ Service Role)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // 🔒 Check if requester is authenticated and is admin
        // 🔒 ตรวจสอบสิทธิ์ Admin
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, full_name, position, staff_id, role } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Use service role to create user
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Create user in auth
        // สร้างผู้ใช้ในระบบ Auth
        const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: full_name || '',
                position: position || '',
                staff_id: staff_id || '',
            },
        });

        if (authError) {
            console.error('Auth error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Create profile entry (using upsert in case there's a trigger already creating it)
        // สร้างข้อมูลในตาราง Profiles (ใช้ upsert กันพลาดกรณีมี Trigger)
        const profileData = {
            id: newUser.user.id,
            email: email,
            full_name: full_name || null,
            position: position || null,
            staff_id: staff_id || null,
            role: role || 'staff',
        };

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert([profileData]);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Try to delete the auth user if profile creation failed
            // ถ้าสร้าง Profile ไม่สำเร็จ ให้ลบ Auth user ทิ้งเพื่อไม่ให้ข้อมูลขยะ
            await adminClient.auth.admin.deleteUser(newUser.user.id);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 📝 Audit Log: Create Staff
        try {
            const clientIp = getClientIp(request);
            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action: 'create_staff',
                entity: 'profiles',
                entity_id: newUser.user.id,
                payload: {
                    email: profileData.email,
                    full_name: profileData.full_name,
                    role: profileData.role,
                    staff_id: profileData.staff_id
                },
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({
            success: true,
            data: {
                id: newUser.user.id,
                email: email,
                full_name: full_name,
                position: position,
                staff_id: staff_id,
                role: role || 'staff',
            }
        });
    } catch (error: any) {
        console.error('Create staff error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// Update staff member
// PUT: อัปเดตข้อมูลพนักงาน
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { id, email, password, full_name, position, staff_id, role } = body;

        if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // 🔒 Smart Password Change Logic
        // If changing own password, warn that it will cause logout
        // But allow admin to change other users' passwords freely
        // 🔒 ตรวจสอบกรณีเปลี่ยนรหัสผ่านตัวเอง (ซึ่งจะทำให้ Logout)
        const isChangingOwnPassword = password && id === user.id;

        if (isChangingOwnPassword) {
            // Option 2: Allow but warn (recommended)
            console.warn(`Admin ${user.email} is changing their own password. They will be logged out.`);
        }

        // Update Auth (Email/Password)
        // อัปเดตข้อมูล Auth (Email/Password)
        const updateData: any = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        // Prepare user_metadata updates
        const userMetadataUpdates: { [key: string]: string | null } = {};
        if (full_name !== undefined) userMetadataUpdates.full_name = full_name;
        if (position !== undefined) userMetadataUpdates.position = position;
        if (staff_id !== undefined) userMetadataUpdates.staff_id = staff_id;

        if (Object.keys(userMetadataUpdates).length > 0) {
            updateData.user_metadata = userMetadataUpdates;
        }

        if (Object.keys(updateData).length > 0) {
            const { error: authError } = await adminClient.auth.admin.updateUserById(id, updateData);
            if (authError) {
                console.error('Auth update error:', authError);
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }
        }

        // Update Profile Table
        // อัปเดตข้อมูลในตาราง Profile
        const profileUpdateData: { [key: string]: string | null } = {};
        if (email !== undefined) profileUpdateData.email = email;
        if (full_name !== undefined) profileUpdateData.full_name = full_name;
        if (position !== undefined) profileUpdateData.position = position;
        if (staff_id !== undefined) profileUpdateData.staff_id = staff_id;
        if (role !== undefined) profileUpdateData.role = role;

        if (Object.keys(profileUpdateData).length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('id', id);

            if (profileError) {
                console.error('Profile update error:', profileError);
                return NextResponse.json({ error: profileError.message }, { status: 500 });
            }

            // 📝 Audit Log: Update Staff
            try {
                const clientIp = getClientIp(request);
                await supabase.from('audit_logs').insert([{
                    user_id: user.id,
                    action: 'update_staff',
                    entity: 'profiles',
                    entity_id: id,
                    payload: {
                        updates: profileUpdateData,
                        password_changed: !!password
                    },
                    ip_address: clientIp
                }]);
            } catch (auditError) {
                console.error('Audit log error:', auditError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update staff error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// Delete staff member
// DELETE: ลบพนักงาน
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Delete from profiles is handled by cascade (if configured) or manually
        // It's safer to delete from profiles first, then auth, in case of cascade issues
        // ลบข้อมูลจาก profile ก่อน แล้วค่อยลบจาก Auth
        const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', id);
        if (profileDeleteError) {
            console.error('Profile delete error:', profileDeleteError);
            return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
        }

        // Delete from Auth
        const { error: authError } = await adminClient.auth.admin.deleteUser(id);
        if (authError) { // Changed 'error' to 'authError'
            console.error('Auth delete error:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 📝 Audit Log: Delete Staff
        try {
            const clientIp = getClientIp(request);
            // The 'user' variable already holds the admin user from the initial check
            if (user) {
                await supabase.from('audit_logs').insert([{
                    user_id: user.id, // Changed 'adminUser' to 'user'
                    action: 'delete_staff',
                    entity: 'profiles',
                    entity_id: id,
                    payload: { deleted_id: id },
                    ip_address: clientIp
                }]);
            }
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete staff error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
