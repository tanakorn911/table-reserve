import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// In-memory store for time slot holds (in production, use Redis or database)
// Key: `${date}-${time}`, Value: { heldBy: string, heldAt: number }
const timeSlotHolds = new Map<string, { heldBy: string; heldAt: number }>();

// In-memory store for confirmed bookings (in production, use database)
const confirmedBookings = new Set<string>();

// Hold duration in milliseconds (30 seconds)
// When user refreshes the page, the hold expires after 30 seconds
const HOLD_DURATION = 30 * 1000;

// Default Opening hours per day (fallback)
const DEFAULT_OPENING_HOURS: { [key: number]: { open: string; close: string } } = {
  0: { open: '10:00', close: '21:00' }, // Sunday
  1: { open: '11:00', close: '22:00' }, // Monday
  2: { open: '11:00', close: '22:00' }, // Tuesday
  3: { open: '11:00', close: '22:00' }, // Wednesday
  4: { open: '11:00', close: '23:00' }, // Thursday
  5: { open: '11:00', close: '23:00' }, // Friday
  6: { open: '10:00', close: '23:00' }, // Saturday
};

// Helper to get business hours
async function getBusinessHours(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'business_hours')
      .single();

    if (error || !data || !data.value) return DEFAULT_OPENING_HOURS;
    return data.value;
  } catch (e) {
    console.error('Error fetching business hours:', e);
    return DEFAULT_OPENING_HOURS;
  }
}

// Clean up expired holds
function cleanupExpiredHolds() {
  const now = Date.now();
  for (const [key, hold] of timeSlotHolds.entries()) {
    if (now - hold.heldAt > HOLD_DURATION) {
      timeSlotHolds.delete(key);
    }
  }
}

// Total number of tables available (fallback)
const TOTAL_TABLES = 5;

// Generate time slots for a specific date
function generateTimeSlots(
  date: string,
  reservations: any[],
  openingHours: any,
  totalTables: number,
  currentSessionId: string | null = null
) {
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  const hours = openingHours[String(dayOfWeek)] || openingHours[dayOfWeek];

  if (!hours) return []; // Closed

  const slots: { time: string; label: string; status: 'available' | 'booked' | 'held' }[] = [];

  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);

  // 105-minute block = 90 min dining + 15 min buffer
  const DURATION_MINUTES = 105;

  let currentMinutes = openHour * 60 + openMin;
  const endMinutes = closeHour * 60 + closeMin;

  // Get current time in Thailand (UTC+7)
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const thailandTime = new Date(utcTime + 7 * 3600000);
  const todayStr = thailandTime.toISOString().split('T')[0];

  const currentTotalMinutes = thailandTime.getHours() * 60 + thailandTime.getMinutes();

  while (currentMinutes < endMinutes) {
    // Ensure booking duration fits before closing
    if (currentMinutes + 90 > endMinutes) break;

    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Skip if in the past
    if (date === todayStr && currentMinutes < currentTotalMinutes) {
      currentMinutes += DURATION_MINUTES;
      continue;
    }

    // --- Calculate Occupancy for this slot ---
    // 1. Check Reservations from DB
    const bookedTableIds = new Set<number>();
    let unnamedBookings = 0;

    reservations.forEach((r) => {
      const dbTime = r.reservation_time.substring(0, 5);
      const [dbH, dbM] = dbTime.split(':').map(Number);
      const dbMinutes = dbH * 60 + dbM;

      // Overlap check: |TimeA - TimeB| < 105 mins
      if (Math.abs(dbMinutes - currentMinutes) < DURATION_MINUTES) {
        if (r.table_number) {
          bookedTableIds.add(r.table_number);
        } else {
          unnamedBookings++;
        }
      }
    });

    const bookedCount = bookedTableIds.size + unnamedBookings;

    // 2. Check Holds in Memory
    let heldCount = 0;
    let heldByCurrentUser = false;

    for (const [key, hold] of timeSlotHolds.entries()) {
      if (key.startsWith(date + '-')) {
        const heldTime = key.split('-').pop() || '';
        const [hH, hM] = heldTime.split(':').map(Number);
        const hMinutes = hH * 60 + hM;

        if (Math.abs(hMinutes - currentMinutes) < DURATION_MINUTES) {
          if (hold.heldBy === currentSessionId && heldTime === timeValue) {
            heldByCurrentUser = true;
          } else {
            heldCount++;
          }
        }
      }
    }

    // --- Determine Status ---
    let status: 'available' | 'booked' | 'held' = 'available';

    if (bookedCount >= totalTables) {
      status = 'booked';
    } else if (bookedCount + heldCount >= totalTables && !heldByCurrentUser) {
      status = 'held';
    }

    slots.push({
      time: timeValue,
      label: `${timeValue} น.`,
      status,
    });

    currentMinutes += DURATION_MINUTES;
  }

  return slots;
}

// GET /api/timeslots?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    cleanupExpiredHolds();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const sessionId = searchParams.get('sessionId');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 1. Business Hours
    const businessHours = await getBusinessHours(supabase);

    // 2. Tables Count
    const { count, error: countError } = await supabase
      .from('tables')
      .select('*', { count: 'exact', head: true });

    // Use count if available and > 0, else fallback to 5
    const totalTables = count !== null && count > 0 ? count : TOTAL_TABLES;

    // 3. Reservations
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('reservation_time, table_number')
      .eq('reservation_date', date)
      .in('status', ['confirmed', 'pending']);

    // 4. Generate Slots
    const slots = generateTimeSlots(
      date,
      reservations || [],
      businessHours,
      totalTables,
      sessionId
    );

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

// POST /api/timeslots - Hold or release a time slot
export async function POST(request: NextRequest) {
  try {
    cleanupExpiredHolds();

    const body = await request.json();
    const { date, time, action, sessionId } = body;

    if (!date || !time || !action || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slotKey = `${date}-${time}`;

    if (action === 'hold') {
      const supabase = await createServerSupabaseClient();

      // 1. Get total tables
      const { count } = await supabase.from('tables').select('*', { count: 'exact', head: true });
      const totalTables = count !== null && count > 0 ? count : TOTAL_TABLES;

      // 2. Check DB Reservations for this time slot (90+15 min overlap)
      const [reqH, reqM] = time.split(':').map(Number);
      const reqMinutes = reqH * 60 + reqM;
      const DURATION = 105;

      const { data: reservations } = await supabase
        .from('reservations')
        .select('reservation_time, table_number')
        .eq('reservation_date', date)
        .in('status', ['confirmed', 'pending']);

      let bookedCount = 0;
      reservations?.forEach((r) => {
        const dbTime = r.reservation_time.substring(0, 5);
        const [dbH, dbM] = dbTime.split(':').map(Number);
        const dbMinutes = dbH * 60 + dbM;
        if (Math.abs(dbMinutes - reqMinutes) < DURATION) {
          bookedCount++;
        }
      });

      if (bookedCount >= totalTables) {
        return NextResponse.json(
          {
            success: false,
            error: 'ช่วงเวลานี้ถูกจองเต็มแล้ว',
          },
          { status: 409 }
        );
      }

      // 3. Check Other Users' Holds
      let heldCount = 0;
      for (const [key, hold] of timeSlotHolds.entries()) {
        if (key.startsWith(date + '-') && hold.heldBy !== sessionId) {
          const heldTime = key.split('-').pop() || '';
          const [hH, hM] = heldTime.split(':').map(Number);
          if (Math.abs(hH * 60 + hM - reqMinutes) < DURATION) {
            heldCount++;
          }
        }
      }

      if (bookedCount + heldCount >= totalTables) {
        return NextResponse.json(
          {
            success: false,
            error: 'ช่วงเวลานี้กำลังมีผู้ทำรายการจองอื่น',
          },
          { status: 409 }
        );
      }

      // 4. Create hold
      timeSlotHolds.set(slotKey, { heldBy: sessionId, heldAt: Date.now() });
      return NextResponse.json({ success: true });
    } else if (action === 'release') {
      const existingHold = timeSlotHolds.get(slotKey);
      if (existingHold && existingHold.heldBy === sessionId) {
        timeSlotHolds.delete(slotKey);
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/timeslots:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
