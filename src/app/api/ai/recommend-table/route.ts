import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { message, date, time, guests } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API Key is missing on the server.' },
                { status: 500 }
            );
        }

        // 1. Fetch ALL tables
        const { data: tables, error: tableError } = await supabase.from('tables').select('*');

        if (tableError) {
            console.error('Table fetch error:', tableError);
            return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
        }

        // 2. Fetch Reservations for the requested date to find occupied tables
        // Note: Ideally this logic matches the one in ReservationWizard to be consistent
        const { data: reservations, error: reservationError } = await supabase
            .from('reservations')
            .select('table_number, reservation_time, status')
            .eq('reservation_date', date)
            .in('status', ['confirmed', 'pending']); // Only care about active bookings

        if (reservationError) {
            console.error('Reservation fetch error:', reservationError);
            return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
        }

        // 3. Filter available tables
        const availableTables = tables.filter((table) => {
            // Capacity check
            if (table.capacity < guests) return false;

            // Availability check
            // For simplicity in this demo, we'll mark it unavailable if there's ANY booking overlap
            // Logic borrowed from frontend
            const isBooked = reservations.some((r) => {
                if (r.table_number !== table.id) return false;

                // Simple time check (assuming 2 hours slot)
                const bookingHour = parseInt(r.reservation_time.substring(0, 2));
                const bookingMin = parseInt(r.reservation_time.substring(3, 5));
                const bookingTotalMins = bookingHour * 60 + bookingMin;

                const selectedHour = parseInt(time.substring(0, 2));
                const selectedMin = parseInt(time.substring(3, 5));
                const selectedTotalMins = selectedHour * 60 + selectedMin;

                const slotDuration = 120; // 2 hours

                const bookingEnd = bookingTotalMins + slotDuration;
                const selectedEnd = selectedTotalMins + slotDuration;

                return selectedTotalMins < bookingEnd && selectedEnd > bookingTotalMins;
            });

            return !isBooked;
        });

        if (availableTables.length === 0) {
            return NextResponse.json({
                recommendedTableId: null,
                reasoning: 'ขออภัยครับ ไม่มีโต๊ะว่างที่รองรับจำนวนลูกค้าในช่วงเวลานี้เลยครับ',
            });
        }

        // 4. Construct Prompt for Gemini
        const modelName = 'gemini-1.5-flash';
        console.log('Initializing Gemini Model:', modelName);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
      Act as a professional restaurant manager named "TableMaster".
      Your goal is to select the BEST table for a customer based on their request.

      Available Tables Data (JSON):
      ${JSON.stringify(
            availableTables.map((t) => ({
                id: t.id,
                name: t.name,
                zone: t.zone,
                description: t.description || 'No description',
                capacity: t.capacity,
                shape: t.shape,
            }))
        )}

      Customer Request: "${message}"
      Party Size: ${guests} people

      Instructions:
      1. Analyze the customer's request (mood, privacy, zone preference, etc.).
      2. Select ONE table from the "Available Tables" list that best fits the request.
      3. If no table perfectly fits, pick the next best one.
      4. Explain WHY you chose this table in a friendly, persuasive tone (in Thai language).
      5. Return ONLY a valid JSON object. Do not include markdown formatting.

      Response Format (JSON Only):
      {
        "recommendedTableId": number,
        "reasoning": "string (Thai language)"
      }
    `;

        // 5. Call Gemini
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log('Gemini Response:', responseText);

        // Clean markdown if present (Gemini sometimes adds ```json ... ```)
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResponse = JSON.parse(cleanedJson);

        return NextResponse.json(parsedResponse);
    } catch (error: any) {
        console.error('AI Error:', error);
        return NextResponse.json(
            { error: error.message || 'AI service failed' },
            { status: 500 }
        );
    }
}
