import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withRetry } from '@/lib/supabase/retry';
import { getCache, setCache, invalidateCache } from '@/lib/cache';

const CACHE_KEY = 'api:ads';
const CACHE_TTL = 60 * 1000;

export async function GET() {
  try {
    const cached = getCache<any>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      return NextResponse.json({ data: cached }, { headers: { 'X-Cache': 'HIT' } });
    }
    const supabase = await createServerSupabaseClient();
    const { data, error } = await withRetry(async () =>
      await supabase.from('advertisements').select('*').order('created_at', { ascending: false })
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    setCache(CACHE_KEY, data);
    return NextResponse.json({ data }, { headers: { 'X-Cache': 'MISS' } });
  } catch (err) {
    console.error('[API /ads] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { title, image_url, link, active } = body;
    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!image_url || typeof image_url !== 'string') return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    const insert = {
      title: title.trim(),
      image_url: image_url.trim(),
      link: link ? link.trim() : null,
      active: typeof active === 'boolean' ? active : true,
      created_at: new Date().toISOString(),
    } as any;
    const { data, error } = await supabase.from('advertisements').insert(insert).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    invalidateCache(CACHE_KEY);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { id, title, image_url, link } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!title || typeof title !== 'string') return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    const update: any = {
      title: title.trim(),
      link: link ? link.trim() : null,
    };
    if (image_url && typeof image_url === 'string') {
      update.image_url = image_url.trim();
    }
    const { data, error } = await supabase
      .from('advertisements')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    invalidateCache(CACHE_KEY);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const { data: existing, error: fetchErr } = await supabase
      .from('advertisements').select('*').eq('id', id).single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    try {
      const imageUrl: string | undefined = (existing as any)?.image_url;
      if (imageUrl && typeof imageUrl === 'string') {
        const marker = '/storage/v1/object/public/advertisements/';
        const idx = imageUrl.indexOf(marker);
        if (idx !== -1) {
          const filePath = imageUrl.substring(idx + marker.length);
          const { error: removeErr } = await supabase.storage.from('advertisements').remove([filePath]);
          if (removeErr) console.error('Failed to remove storage file:', removeErr.message);
        }
      }
    } catch (err) {
      console.error('Storage deletion error', err);
    }
    const { data, error } = await supabase.from('advertisements').delete().eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    invalidateCache(CACHE_KEY);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}