import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withRetry } from '@/lib/supabase/retry';
import { getCache, setCache, invalidateCache } from '@/lib/cache';
import { getClientIp } from '@/lib/ratelimit';

const CACHE_KEY = 'api:ads';
const CACHE_TTL = 60 * 1000; // 60 วินาที (อายุ Cache)

/**
 * GET - ดึงรายการโฆษณา (Advertisements)
 * - ใช้ Cache เพื่อลดการ Query Database
 * - เรียงลำดับตามวันที่สร้างล่าสุด
 */
export async function GET() {
  try {
    // 1. ลองดึงข้อมูลจาก Cache ก่อน
    const cached = getCache<any>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      return NextResponse.json({ data: cached }, {
        headers: { 'X-Cache': 'HIT' }, // ระบุว่าข้อมูลมาจาก Cache
      });
    }

    // 2. ถ้าไม่มีใน Cache ให้ดึงจาก Database
    const supabase = await createServerSupabaseClient();
    const { data, error } = await withRetry(async () =>
      await supabase.from('advertisements').select('*').order('created_at', { ascending: false })
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 3. บันทึกข้อมูลลง Cache และส่งคืนผลลัพธ์
    setCache(CACHE_KEY, data);
    return NextResponse.json({ data }, {
      headers: { 'X-Cache': 'MISS' }, // ระบุว่าข้อมูลไม่ได้มาจาก Cache (ดึงใหม่)
    });
  } catch (err) {
    console.error('[API /ads] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - สร้างโฆษณาใหม่
 * - เฉพาะ Admin เท่านั้น
 * - ล้าง Cache เมื่อมีการเพิ่มข้อมูล
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. ตรวจสอบสิทธิ์ (Must be Admin)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, image_url, link, active } = body;

    // 2. ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!image_url || typeof image_url !== 'string') return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });

    const insert = {
      title: title.trim(),
      image_url: image_url.trim(),
      link: link ? link.trim() : null,
      active: typeof active === 'boolean' ? active : true,
      created_at: new Date().toISOString(),
    } as any;

    // 3. บันทึกลง Database
    const { data, error } = await supabase.from('advertisements').insert(insert).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 4. ล้าง Cache เพื่อให้ครั้งต่อไปดึงข้อมูลใหม่
    invalidateCache(CACHE_KEY);

    // 📝 Audit Log: Create Ad
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'create_ad',
        entity: 'advertisements',
        entity_id: data.id,
        payload: insert,
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - ลบโฆษณา
 * - เฉพาะ Admin เท่านั้น
 * - ลบรูปภาพจาก Storage ด้วยถ้ามี
 * - ล้าง Cache หลังลบเสร็จ
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. ตรวจสอบสิทธิ์ (Must be Admin)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // 2. ดึงข้อมูลก่อนลบ เพื่อหา URL ของรูปภาพ
    const { data: existing, error: fetchErr } = await supabase
      .from('advertisements')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // 3. ลบรูปภาพจาก Storage (ถ้าเป็นไฟล์ที่เก็บใน Supabase Storage)
    try {
      const imageUrl: string | undefined = (existing as any)?.image_url;
      if (imageUrl && typeof imageUrl === 'string') {
        // Pattern URL ของ Supabase Storage: <SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>
        // เราจะตัดหา Path หลังจาก /advertisements/
        const marker = '/storage/v1/object/public/advertisements/';
        const idx = imageUrl.indexOf(marker);
        if (idx !== -1) {
          const filePath = imageUrl.substring(idx + marker.length);
          // ลบไฟล์
          const { error: removeErr } = await supabase.storage.from('advertisements').remove([filePath]);
          if (removeErr) {
            console.error('Failed to remove storage file:', removeErr.message);
          }
        }
      }
    } catch (err) {
      console.error('Storage deletion error', err);
    }

    // 4. ลบข้อมูลจาก Database
    const { data, error } = await supabase.from('advertisements').delete().eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 5. ล้าง Cache
    invalidateCache(CACHE_KEY);

    // 📝 Audit Log: Delete Ad
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'delete_ad',
        entity: 'advertisements',
        entity_id: id,
        payload: { id },
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT - แก้ไขข้อมูลโฆษณา
 * - เฉพาะ Admin เท่านั้น
 * - ล้าง Cache หลังแก้ไขเสร็จ
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. ตรวจสอบสิทธิ์ (Must be Admin)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, title, image_url, link, active } = body;

    // 2. ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!image_url || typeof image_url !== 'string') return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });

    const update = {
      title: title.trim(),
      image_url: image_url.trim(),
      link: link ? link.trim() : null,
      active: typeof active === 'boolean' ? active : true,
    } as any;

    // 3. อัปเดตข้อมูลใน Database
    const { data, error } = await supabase.from('advertisements').update(update).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 4. ล้าง Cache
    invalidateCache(CACHE_KEY);

    // 📝 Audit Log: Update Ad
    try {
      const clientIp = getClientIp(request);
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'update_ad',
        entity: 'advertisements',
        entity_id: id,
        payload: update,
        ip_address: clientIp
      }]);
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
