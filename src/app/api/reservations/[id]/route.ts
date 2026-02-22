import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UpdateReservationInput } from '@/types/database.types';
import { sendLineNotification } from '@/lib/notifications';
import { getClientIp } from '@/lib/ratelimit';
import { getReservationSettings } from '@/lib/settings';

// GET /api/reservations/[id] - Get a single reservation
// GET: ดึงข้อมูลการจอง 1 รายการ
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth (getUser แทน getSession เพื่อ verify JWT)
    // ตรวจสอบสิทธิ์การใช้งาน (ต้องล็อกอินก่อน)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
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
// PUT: อัปเดตข้อมูลการจอง
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth
    // ตรวจสอบสิทธิ์การใช้งาน
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateReservationInput = await request.json();

    // Validate party size if provided
    // ตรวจสอบจำนวนลูกค้า (ต้องอยู่ระหว่าง 1-50 คน)
    if (body.party_size !== undefined && (body.party_size < 1 || body.party_size > 50)) {
      return NextResponse.json({ error: 'Party size must be between 1 and 50' }, { status: 400 });
    }

    // Validate status if provided
    // ตรวจสอบสถานะที่ส่งมา
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, cancelled, completed' },
        { status: 400 }
      );
    }

    // --- FETCH EXISTING RESERVATION TO CHECK FOR OVERLAP ---
    const { data: currentRes, error: currentResError } = await supabase
      .from('reservations')
      .select('reservation_date, reservation_time, table_number, status')
      .eq('id', id)
      .single();

    if (currentResError || !currentRes) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Merge old and new values to check the final targeted state
    const targetDate = body.reservation_date || currentRes.reservation_date;
    const targetTime = body.reservation_time || currentRes.reservation_time;
    const targetTable = body.table_number !== undefined ? body.table_number : currentRes.table_number;
    const targetStatus = body.status || currentRes.status;

    // Check availability only if it's 'pending' or 'confirmed' and it has a table assigned
    if (targetTable && ['pending', 'confirmed'].includes(targetStatus)) {
      const { dining_duration, buffer_time } = await getReservationSettings();
      const totalDuration = dining_duration + buffer_time;

      const [reqHour, reqMinute] = targetTime.split(':').map(Number);
      const reqMinutes = reqHour * 60 + reqMinute;

      const { data: existingReservations, error: checkError } = await supabase
        .from('reservations')
        .select('id, reservation_time, status')
        .eq('reservation_date', targetDate)
        .eq('table_number', targetTable)
        .in('status', ['confirmed', 'pending'])
        .neq('id', id); // exclude itself

      if (checkError) {
        console.error('Error checking availability:', checkError);
        return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
      }

      const hasOverlap = existingReservations?.some((r) => {
        const dbTime = r.reservation_time.substring(0, 5); // HH:mm
        const [dbHour, dbMinute] = dbTime.split(':').map(Number);
        const dbMinutes = dbHour * 60 + dbMinute;

        // Overlap check: |TimeA - TimeB| < totalDuration
        return Math.abs(dbMinutes - reqMinutes) < totalDuration;
      });

      if (hasOverlap) {
        return NextResponse.json(
          {
            error: `ไม่สามารถใช้โต๊ะนี้ได้ เนื่องจากมีรายการจองอื่นแล้วในช่วงเวลาดังกล่าว (Table is already booked during this time slot)`
          },
          { status: 409 }
        );
      }
    }

    // Update reservation
    // อัปเดตข้อมูลลงฐานข้อมูล
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
    // ส่งไลน์แจ้งเตือนเมื่อมีการอัปเดตข้อมูล
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
        // ดึงชื่อโต๊ะใหม่ถ้ามีการเปลี่ยนโต๊ะ
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
        // ดึงข้อมูลพนักงานที่ทำการแก้ไข
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
    // 📝 Audit Log: Update Reservation
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'admin_update_reservation',
        entity: 'reservations',
        entity_id: id,
        payload: body,
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reservations/[id] - Cancel a reservation (hard delete)
// DELETE: ลบรายการจอง (ลบถาวร)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check Auth
    // ตรวจสอบสิทธิ์การใช้งาน
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the reservation data to send notification
    // ดึงข้อมูลการจองก่อนลบ เพื่อใช้ส่งแจ้งเตือน
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
    // ลบข้อมูลออกจากฐานข้อมูลถาวร
    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete reservation', details: error.message },
        { status: 500 }
      );
    }

    // Send Notification for Cancellation
    // ส่งไลน์แจ้งเตือนการลบ
    (async () => {
      try {
        // Get staff details from profiles table for up-to-date info
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
    // 📝 Audit Log: Delete Reservation
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'admin_delete_reservation',
        entity: 'reservations',
        entity_id: id,
        payload: { id, guest_name: existingData.guest_name, date: existingData.reservation_date },
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      message: 'Reservation deleted successfully',
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
