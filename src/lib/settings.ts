import { createServerSupabaseClient } from './supabase/server';

export async function getReservationSettings() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['dining_duration', 'buffer_time']);

        const settings = {
            dining_duration: 90,
            buffer_time: 15
        };

        if (data) {
            data.forEach((s: any) => {
                if (s.key === 'dining_duration') settings.dining_duration = Number(s.value);
                if (s.key === 'buffer_time') settings.buffer_time = Number(s.value);
            });
        }
        return settings;
    } catch (e) {
        console.error('Error fetching reservation settings:', e);
        return { dining_duration: 90, buffer_time: 15 };
    }
}
