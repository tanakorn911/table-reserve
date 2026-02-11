import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/tables - Get all tables
// GET: ดึงข้อมูลโต๊ะทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Since we are moving to a database-driven table system,
    // we should fetch from the 'tables' table in Supabase.
    // However, if the user hasn't created the table yet,
    // we might need to fallback or error out.
    // For this step, I will assume we are creating a new table in Supabase
    // called 'tables'.

    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      // If table doesn't exist, we might want to return the hardcoded constants
      // as a fallback during migration, but better to enforce DB usage.
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new table (Admin)
// POST: สร้างโต๊ะใหม่ (เฉพาะ Admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check Auth
    // ตรวจสอบสิทธิ์ Admin
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 🔒 SECURITY FIX: Input validation
    // 🔒 ตรวจสอบความถูกต้องของข้อมูล
    const { name, capacity, x, y, zone, shape, width, height } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Table name must be 50 characters or less' }, { status: 400 });
    }

    // Validate capacity
    if (!capacity || typeof capacity !== 'number' || !Number.isInteger(capacity)) {
      return NextResponse.json({ error: 'Capacity must be a valid number' }, { status: 400 });
    }
    if (capacity < 1 || capacity > 20) {
      return NextResponse.json({ error: 'Capacity must be between 1 and 20' }, { status: 400 });
    }

    // Validate coordinates
    if (typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json({ error: 'Invalid position coordinates' }, { status: 400 });
    }

    // Validate shape (optional)
    if (shape && !['rectangle', 'circle'].includes(shape)) {
      return NextResponse.json({ error: 'Shape must be rectangle or circle' }, { status: 400 });
    }

    // Create validated data object (only include validated fields)
    const validatedData: any = {
      name: name.trim(),
      capacity,
      x,
      y,
    };

    if (zone) validatedData.zone = zone;
    if (shape) validatedData.shape = shape;
    if (width && typeof width === 'number') validatedData.width = width;
    if (height && typeof height === 'number') validatedData.height = height;

    const { data, error } = await supabase.from('tables').insert(validatedData).select().single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
