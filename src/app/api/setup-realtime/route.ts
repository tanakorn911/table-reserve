import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/setup-realtime
 * 
 * เปิดใช้งาน Supabase Realtime สำหรับตาราง holidays (และตารางอื่นๆ)
 * รัน SQL ผ่าน Prisma Client ที่เชื่อมต่อกับ Supabase โดยตรง
 */
export async function POST() {
    const results: { table: string; status: string }[] = [];

    try {
        const tables = ['holidays', 'advertisements', 'reservations', 'feedback'];

        // 1. ตรวจสอบว่ามี publication หรือยัง
        const publications: any[] = await prisma.$queryRaw`
            SELECT pubname FROM pg_publication WHERE pubname = 'supabase_realtime';
        `;

        if (publications.length === 0) {
            await prisma.$executeRawUnsafe(`CREATE PUBLICATION supabase_realtime FOR ALL TABLES;`);
            results.push({ table: 'publication', status: 'created' });
        } else {
            results.push({ table: 'publication', status: 'already exists' });
        }

        // 2. เพิ่มแต่ละตารางเข้า publication + ตั้ง RLS + REPLICA IDENTITY
        for (const table of tables) {
            try {
                // เพิ่มเข้า publication
                try {
                    await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE ${table};`);
                } catch (e: any) {
                    if (!e.message?.includes('already member')) {
                        // ไม่ใช่ error ที่คาดไว้ ให้ log แต่ไม่หยุด
                    }
                }

                // ตั้ง REPLICA IDENTITY FULL
                await prisma.$executeRawUnsafe(`ALTER TABLE ${table} REPLICA IDENTITY FULL;`);

                // เปิด RLS
                await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

                // สร้าง policy สำหรับ public read access
                const policyName = `Enable public read access for ${table}`;
                await prisma.$executeRawUnsafe(`
                    DO $$ 
                    BEGIN
                      IF NOT EXISTS (
                        SELECT 1 FROM pg_policies 
                        WHERE tablename = '${table}' AND policyname = '${policyName}'
                      ) THEN
                        CREATE POLICY "${policyName}" ON "public"."${table}" FOR SELECT USING (true);
                      END IF;
                    END $$;
                `);

                results.push({ table, status: '✅ configured' });
            } catch (e: any) {
                results.push({ table, status: `⚠️ ${e.message}` });
            }
        }

        return NextResponse.json({
            success: true,
            message: '🎉 Realtime configuration completed!',
            results,
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal server error', results },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'ส่ง POST request มาที่ /api/setup-realtime เพื่อเปิด Realtime',
        usage: 'curl -X POST http://localhost:4028/api/setup-realtime',
    });
}
