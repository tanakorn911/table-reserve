import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { withRetry } from '@/lib/supabase/retry';
import { getCache, setCache, invalidateCacheByPrefix } from '@/lib/cache';

const CACHE_PREFIX = 'api:settings';
const CACHE_TTL = 5 * 60 * 1000; // 5 นาที

// GET: Fetch Settings
// GET: ดึงค่าตั้งค่าระบบ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const cacheKey = `${CACHE_PREFIX}:${key || 'all'}`;

    // ดึงจาก cache ก่อน (เฉพาะ public request: business_hours)
    if (key === 'business_hours') {
      const cached = getCache<any>(cacheKey, CACHE_TTL);
      if (cached) {
        return NextResponse.json({ data: cached }, {
          headers: { 'X-Cache': 'HIT' },
        });
      }
    }

    const supabase = await createServerSupabaseClient();

    // 🔒 Authentication required (except for business hours)
    // 🔒 ตรวจสอบสิทธิ์ (ยกเว้น business_hours ที่เปิดเป็น Public)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && key !== 'business_hours') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase.from('settings').select('*');

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await withRetry(async () => await query);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform array to object if fetching all, or return single item if key specified
    if (key && data && data.length > 0) {
      setCache(cacheKey, data[0]); // บันทึกลง cache
      return NextResponse.json({ data: data[0] }, {
        headers: { 'X-Cache': 'MISS' },
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upsert Settings (Admin)
// POST: สร้างหรืออัปเดตค่าตั้งค่า (เฉพาะ Admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 🔒 Authentication required
    // 🔒 ตรวจสอบสิทธิ์การใช้งาน
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    // Upsert setting
    // บันทึกค่าตั้งค่า (ถ้ามีอยู่แล้วจะอัปเดต)
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        key,
        value,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateCacheByPrefix(CACHE_PREFIX); // ล้าง cache เมื่ออัปเดต
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update User Profile (Admin Only)
// PUT: อัปเดตข้อมูลพนักงาน (เฉพาะ Admin)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data } = body;

    if (!userId || !data) {
      return NextResponse.json({ error: 'User ID and data are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if requester is authenticated
    // ตรวจสอบสิทธิ์ผู้เรียกใช้งาน
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 Check if user is admin - CRITICAL SECURITY FIX
    // 🔒 ตรวจสอบว่าเป็น Admin จริงหรือไม่
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Update profile
    // อัปเดตข้อมูลลงฐานข้อมูล profiles
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        position: data.position,
        staff_id: data.staff_id,
      })
      .eq('id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
