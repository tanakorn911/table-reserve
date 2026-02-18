import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/ratelimit';

// PUT /api/tables/[id] - Update a table
// PUT: อัปเดตข้อมูลโต๊ะ (เฉพาะ Admin)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth (getUser แทน getSession เพื่อ verify JWT)
    // ตรวจสอบสิทธิ์ Admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('tables')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 📝 Audit Log: Update Table
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'update_table',
        entity: 'tables',
        entity_id: id,
        payload: body,
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tables/[id] - Delete a table
// DELETE: ลบโต๊ะ (เฉพาะ Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth
    // ตรวจสอบสิทธิ์ Admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('tables').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 📝 Audit Log: Delete Table
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'delete_table',
        entity: 'tables',
        entity_id: id,
        payload: { id },
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
