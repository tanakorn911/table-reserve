import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Advertisements Realtime configuration fix...');

    try {
        // 1. ตรวจสอบว่ามี publication 'supabase_realtime' อยู่แล้วหรือไม่
        const publicationExists = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT 1
                FROM pg_publication
                WHERE pubname = 'supabase_realtime'
            );
        `;

        if (!(publicationExists as any)[0]?.exists) {
            console.log('Creating publication supabase_realtime...');
            await prisma.$executeRaw`CREATE PUBLICATION supabase_realtime FOR ALL TABLES;`;
            console.log('✅ Publication supabase_realtime created.');
        } else {
            console.log('✅ Publication "supabase_realtime" found.');
        }

        // 2. เพิ่มตาราง 'advertisements' เข้า publication (ถ้ายังไม่มี)
        const tableIsPublished = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT 1
                FROM pg_publication_tables
                WHERE pubname = 'supabase_realtime' AND tablename = 'advertisements'
            );
        `;

        if (!(tableIsPublished as any)[0]?.exists) {
            console.log('🔄 Adding "advertisements" table to "supabase_realtime"...');
            await prisma.$executeRaw`ALTER PUBLICATION supabase_realtime ADD TABLE advertisements;`;
            console.log('✅ Added "advertisements" to "supabase_realtime".');
        } else {
            console.log('✅ "advertisements" table is already published.');
        }

        // 3. ตรวจสอบและสร้าง RLS policy สำหรับตาราง advertisements
        const policyExists = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT 1
                FROM pg_policies
                WHERE tablename = 'advertisements' AND policyname = 'Enable read access for authenticated users'
            );
        `;

        if (!(policyExists as any)[0]?.exists) {
            console.log('🔄 Creating RLS policy for advertisements...');
            await prisma.$executeRaw`
                CREATE POLICY "Enable read access for authenticated users"
                ON "advertisements"
                AS PERMISSIVE
                FOR SELECT
                TO authenticated
                USING (true);
            `;
            console.log('✅ Created RLS policy: Enable read access for authenticated users');
        } else {
            console.log('✅ RLS policy "Enable read access for authenticated users" already exists.');
        }

        // 4. ตรวจสอบว่า RLS เปิดอยู่บนตาราง advertisements หรือไม่
        const rlsEnabled = await prisma.$queryRaw`
            SELECT relrowsecurity
            FROM pg_class
            WHERE relname = 'advertisements';
        `;

        if (!(rlsEnabled as any)[0]?.relrowsecurity) {
            console.log('🔄 Enabling RLS on "advertisements" table...');
            await prisma.$executeRaw`ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;`;
            console.log('✅ RLS enabled on "advertisements".');
        } else {
            console.log('✅ RLS is already enabled on "advertisements".');
        }

        console.log('🎉 Advertisements Realtime configuration completed successfully!');

    } catch (error) {
        console.error('❌ Error configuring Realtime for advertisements:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 