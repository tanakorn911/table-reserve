
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/tables - Get all tables
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

// POST /api/tables - Create a new table
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const { data, error } = await supabase
            .from('tables')
            .insert(body)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
