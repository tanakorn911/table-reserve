import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { CreateReservationInput } from '@/types/database.types';
import { sendLineNotification, sendEmailConfirmation } from '@/lib/notifications';

// GET /api/reservations - Get reservations (Public/Protected hybrid)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isAdmin = !!session;

    const { searchParams } = new URL(request.url);

    // Optional filters
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // Admin can see everything (*), Public sees limited fields
    // Public needs to see booked slots to avoid conflict
    const selectFields = isAdmin ? '*' : 'reservation_time, table_number, status, reservation_date';

    let query = supabase
      .from('reservations')
      .select(selectFields)
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('reservation_date', date);
    }

    // If public, only show confirmed or pending (active) reservations
    // Admins might want to see 'cancelled' too (but usually filtered by param)
    if (!isAdmin) {
      query = query.in('status', ['confirmed', 'pending']);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservations', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reservations - Create a new reservation (Public)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const reqBody = await request.json();
    const { locale, ...body } = reqBody;

    // Validate required fields
    const requiredFields = [
      'guest_name',
      'guest_phone',
      'party_size',
      'reservation_date',
      'reservation_time',
    ];
    for (const field of requiredFields) {
      if (!body[field as keyof CreateReservationInput]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate party size
    if (body.party_size < 1 || body.party_size > 50) {
      return NextResponse.json({ error: 'Party size must be between 1 and 50' }, { status: 400 });
    }

    // Check if table is already booked for this date and time
    if (body.table_number) {
      // 90 mins dining + 15 mins buffer = 105 mins total block
      const totalDuration = 90 + 15;

      // Convert requested time to minutes
      const [reqHour, reqMinute] = body.reservation_time.split(':').map(Number);
      const reqMinutes = reqHour * 60 + reqMinute;

      const { data: existingReservations, error: checkError } = await supabase
        .from('reservations')
        .select('reservation_time, status')
        .eq('reservation_date', body.reservation_date)
        .eq('table_number', body.table_number) // Check specific table
        .in('status', ['confirmed', 'pending']);

      if (checkError) {
        console.error('Error checking availability:', checkError);
        return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
      }

      const hasOverlap = existingReservations?.some((r) => {
        const dbTime = r.reservation_time.substring(0, 5); // HH:mm
        const [dbHour, dbMinute] = dbTime.split(':').map(Number);
        const dbMinutes = dbHour * 60 + dbMinute;

        // Overlap check: |TimeA - TimeB| < 105 mins
        return Math.abs(dbMinutes - reqMinutes) < totalDuration;
      });

      if (hasOverlap) {
        return NextResponse.json(
          {
            error: locale === 'th'
              ? 'โต๊ะนี้มีรายการจองอื่นแล้วในช่วงเวลาดังกล่าว (รวมเวลาพักโต๊ะ 105 นาที)'
              : 'Table is already booked during this time slot (including 105 min buffer)'
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...body,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create reservation', details: error.message },
        { status: 500 }
      );
    }

    // Send Notifications (Async - don't block response)
    (async () => {
      try {
        // 1. LINE Notify to Staff
        const bookingCode = data.booking_code || data.id.slice(0, 8);
        const message = `📢 จองโต๊ะใหม่! [${bookingCode}]\nคุณ ${data.guest_name}\n📞 ${data.guest_phone}\n👥 ${data.party_size} ท่าน\n📅 ${data.reservation_date} เวลา ${data.reservation_time}\n🪑 โต๊ะ ${data.table_number || '-'}\n📝 ${data.special_requests || '-'}`;
        await sendLineNotification(message, data.payment_slip_url);

        // 2. Email Confirmation to Customer
        if (data.guest_email) {
          await sendEmailConfirmation(data.guest_email, data, locale || 'th');
        }
      } catch (e) {
        console.error('Notification error', e);
      }
    })();

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
