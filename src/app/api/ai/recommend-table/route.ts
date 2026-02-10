import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        // Check if Gemini API key is available
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API Key is not configured' },
                { status: 500 }
            );
        }

        const supabase = await createServerSupabaseClient();
        const { message, date, time, guests, locale } = await request.json();

        // Check language preference
        const isThai = locale === 'th';
        const languageInstruction = isThai
            ? '(in Thai language)'
            : '(in English language)';

        // 1. Fetch ALL tables
        const { data: tables, error: tableError } = await supabase.from('tables').select('*');

        if (tableError) {
            console.error('Table fetch error:', tableError);
            return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
        }

        // 2. Fetch Reservations for the requested date to find occupied tables
        const { data: reservations, error: reservationError } = await supabase
            .from('reservations')
            .select('table_number, reservation_time, status')
            .eq('reservation_date', date)
            .in('status', ['confirmed', 'pending']);

        if (reservationError) {
            console.error('Reservation fetch error:', reservationError);
            return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
        }

        // 3. Filter available tables
        const availableTables = tables.filter((table) => {
            if (table.capacity < guests) return false;

            const isBooked = reservations.some((r) => {
                if (r.table_number !== table.id) return false;

                try {
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
                } catch (e) { return true; }
            });

            return !isBooked;
        });

        if (availableTables.length === 0) {
            return NextResponse.json({
                recommendedTableId: null,
                reasoning: isThai ? 'ขออภัยครับ ไม่มีโต๊ะว่างในช่วงเวลานี้ครับ' : 'Sorry, no tables available at this time.',
            });
        }

        // 4. Initialize Model and call AI
        const modelInstance = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
      Response Language: ${isThai ? 'Thai' : 'English'}

      Instructions:
      1. Analyze the customer's request (mood, privacy, zone preference, etc.).
      2. Analyze the language of the request. If the Customer Request is in English, reply in English regardless of the preferred Response Language. Otherwise follow the Response Language.
      3. Select ONE table from the "Available Tables" list that best fits the request.
      4. If no table perfectly fits, pick the next best one.
      5. Explain WHY you chose this table in a friendly, persuasive tone ${languageInstruction}.
      6. Return ONLY a valid JSON object. Do not include markdown formatting.

      Response Format (JSON Only):
      {
        "recommendedTableId": number,
        "reasoning": "string ${languageInstruction}"
      }
    `;

        try {
            // Helper for delay
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            // Retry logic with backoff
            const generateWithRetry = async (retries = 3, delayMs = 1000) => {
                try {
                    return await modelInstance.generateContent(prompt);
                } catch (error: any) {
                    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
                        console.log(`Rate limit hit, retrying in ${delayMs}ms... (${retries} retries left)`);
                        await delay(delayMs);
                        return generateWithRetry(retries - 1, delayMs * 2);
                    }
                    throw error;
                }
            };

            const result = await generateWithRetry();
            const responseText = result.response.text();

            console.log('Gemini Response:', responseText);

            // Clean markdown if present (Gemini sometimes adds ```json ... ```)
            const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResponse = JSON.parse(cleanedJson);

            // Enhance response with table name
            const recommendedTable = availableTables.find(t => t.id === parsedResponse.recommendedTableId);
            const finalResponse = {
                ...parsedResponse,
                recommendedTableName: recommendedTable?.name || `Table ${parsedResponse.recommendedTableId}`
            };

            return NextResponse.json(finalResponse);

        } catch (error: any) {
            console.error('AI Error:', error);

            // Fallback Logic: Pick a random available table if AI fails
            if (availableTables.length > 0) {
                console.warn('AI failed, using fallback recommendation.');
                const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];

                const fallbackReasoning = isThai
                    ? "ขณะนี้ AI กำลังทำงานหนัก แต่เราขอแนะนำโต๊ะนี้ให้คุณแทนตามจำนวนลูกค้าครับ"
                    : "AI is currently experiencing high traffic, but we recommend this table based on your party size.";

                return NextResponse.json({
                    recommendedTableId: randomTable.id,
                    recommendedTableName: randomTable.name,
                    reasoning: fallbackReasoning
                });
            }

            return NextResponse.json(
                { error: error.message || 'AI service failed and no tables available for fallback' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
