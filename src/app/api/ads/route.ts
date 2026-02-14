import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/ads - list ads
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ads - create ad (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/ads - delete ad (admin only). Expect JSON body { id }
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data, error } = await supabase.from('advertisements').delete().eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
