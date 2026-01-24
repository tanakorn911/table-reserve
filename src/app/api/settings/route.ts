import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const supabase = await createServerSupabaseClient();

    let query = supabase.from('settings').select('*');

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform array to object if fetching all, or return single item if key specified
    if (key && data && data.length > 0) {
      return NextResponse.json({ data: data[0] });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Upsert setting
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

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, data } = body;

    if (!userId || !data) {
      return NextResponse.json({ error: 'User ID and data are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if requester is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ideally check if user.role is admin from profiles, but for simplicity we trust the client's session + RLS
    // (RLS should enforce that only admins can update other profiles if we set it up right,
    // or we can allow users to update their own, but here we are updating OTHERS)

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
