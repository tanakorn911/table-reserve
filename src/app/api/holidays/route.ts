import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getClientIp } from '@/lib/ratelimit';

/**
 * GET - Fetch all holidays
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .order('holiday_date', { ascending: true });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST - Add community of holidays
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { dates } = body; // Expected array of { holiday_date, description }

        if (!Array.isArray(dates) || dates.length === 0) {
            return NextResponse.json({ error: 'Dates array is required' }, { status: 400 });
        }

        const { error } = await supabase.from('holidays').insert(dates);
        if (error) {
            if (error.code === '23505') return NextResponse.json({ error: 'Some dates are already holidays' }, { status: 409 });
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 📝 Audit Log: Create Holiday
        try {
            const clientIp = getClientIp(request);
            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action: 'create_holiday',
                entity: 'holidays',
                entity_id: null,
                payload: { dates },
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT - Update holiday(s) description
 */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, description, oldDescription, newDescription, holiday_date } = body;

        if (oldDescription && newDescription !== undefined) {
            // Bulk update: เปลี่ยนชื่อกลุ่มวันหยุดทั้งหมดที่มี description เดียวกัน
            const { error } = await supabase
                .from('holidays')
                .update({ description: newDescription })
                .eq('description', oldDescription);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else if (id) {
            // Single update: แก้ไขวันหยุดรายการเดียว
            const updateData: any = {};
            if (description !== undefined) updateData.description = description;
            if (holiday_date) updateData.holiday_date = holiday_date;

            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
            }

            const { error } = await supabase
                .from('holidays')
                .update(updateData)
                .eq('id', id);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'Missing id or oldDescription' }, { status: 400 });
        }

        // 📝 Audit Log: Update Holiday
        try {
            const clientIp = getClientIp(request);
            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action: 'update_holiday',
                entity: 'holidays',
                entity_id: id || null,
                payload: body,
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE - Remove holidays
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const ids = searchParams.get('ids');
        const description = searchParams.get('description');
        const deleteAll = searchParams.get('all') === 'true';

        let query = supabase.from('holidays').delete();

        if (deleteAll) {
            // Delete all holidays
            const { error } = await query.neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else if (ids) {
            // Bulk delete by IDs
            const idList = ids.split(',');
            const { error } = await query.in('id', idList);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else if (description) {
            // Delete by group description
            const { error } = await query.eq('description', description);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else if (id) {
            // Delete single ID
            const { error } = await query.eq('id', id);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'Missing filter' }, { status: 400 });
        }

        // 📝 Audit Log: Delete Holiday
        try {
            const clientIp = getClientIp(request);
            await supabase.from('audit_logs').insert([{
                user_id: user.id,
                action: 'delete_holiday',
                entity: 'holidays',
                entity_id: id || null,
                payload: { id, description, deleteAll },
                ip_address: clientIp
            }]);
        } catch (auditError) {
            console.error('Audit log error:', auditError);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
