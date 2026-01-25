import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UpdateReservationInput } from '@/types/database.types';
import { sendLineNotification } from '@/lib/notifications';

// GET /api/reservations/[id] - Get a single reservation
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.from('reservations').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservation', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/reservations/[id] - Update a reservation
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateReservationInput = await request.json();

    // Validate party size if provided
    if (body.party_size !== undefined && (body.party_size < 1 || body.party_size > 50)) {
      return NextResponse.json({ error: 'Party size must be between 1 and 50' }, { status: 400 });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update reservation', details: error.message },
        { status: 500 }
      );
    }

    // Send Notification for Update
    (async () => {
      try {
        const statusMap: any = {
          confirmed: '✅ ยืนยันแล้ว',
          pending: '⏳ รอการยืนยัน',
          cancelled: '❌ ยกเลิกแล้ว',
          completed: '🏁 เสร็จสิ้น',
        };

        let changeMsg = '';
        if (body.status) changeMsg += `\n📌 สถานะ: ${statusMap[body.status] || body.status}`;
        if (body.reservation_date || body.reservation_time) {
          changeMsg += `\n📅 เปลี่ยนเป็น: ${body.reservation_date || data.reservation_date} เวลา ${body.reservation_time || data.reservation_time}`;
        }

        // Get table name if table changed
        if (body.table_number) {
          const { data: tableData } = await supabase
            .from('tables')
            .select('name')
            .eq('id', body.table_number)
            .single();

          const tableName = tableData?.name || body.table_number;
          changeMsg += `\n🪑 ย้ายไปโต๊ะ: ${tableName}`;
        }

        // Get staff details from profiles table for up-to-date info
        const { user } = session;
        let staffName = user.email?.split('@')[0] || 'Admin';
        let staffPosition = 'Staff';
        let staffId = `ST-${user.id.substring(0, 4).toUpperCase()}`;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, position, staff_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          staffName = profile.full_name || staffName;
          staffPosition = profile.position || staffPosition;
          staffId = profile.staff_id || staffId;
        }

        const bookingCode = data.booking_code || data.id.slice(0, 8);
        const message = `🔄 อัปเดตการจอง! [${bookingCode}]\nคุณ ${data.guest_name}\n📞 ${data.guest_phone}${changeMsg}\n\nโดย: ${staffName} (${staffId})\nตำแหน่ง: ${staffPosition}`;
        await sendLineNotification(message);
      } catch (e) {
        console.error('Notification error', e);
      }
    })();

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reservations/[id] - Cancel a reservation (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the reservation data to send notification
    const { data: existingData, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      // If not found, just return (maybe already deleted)
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Hard delete: remove from database
    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete reservation', details: error.message },
        { status: 500 }
      );
    }

    // Send Notification for Cancellation
    (async () => {
      try {
        // Get staff details from profiles table for up-to-date info
        const { user } = session;
        let staffName = user.email?.split('@')[0] || 'Admin';
        let staffPosition = 'Staff';
        let staffId = `ST-${user.id.substring(0, 4).toUpperCase()}`;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, position, staff_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          staffName = profile.full_name || staffName;
          staffPosition = profile.position || staffPosition;
          staffId = profile.staff_id || staffId;
        }

        const message = `🚫 ลบรายการจองถาวร!\nคุณ ${existingData.guest_name}\n📅 ${existingData.reservation_date} เวลา ${existingData.reservation_time}\n\nโดย: ${staffName} (${staffId})\nตำแหน่ง: ${staffPosition}`;
        await sendLineNotification(message);
      } catch (e) {
        console.error('Notification error', e);
      }
    })();

    return NextResponse.json({
      message: 'Reservation deleted successfully',
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
