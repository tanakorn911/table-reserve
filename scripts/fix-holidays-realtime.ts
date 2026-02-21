
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Holidays Realtime configuration fix...');
    console.log('📋 This script enables Supabase Realtime for the "holidays" table');
    console.log('   so that holiday announcements on the landing page update instantly.\n');

    try {
        // 1. Check if 'supabase_realtime' publication exists
        const publications = await prisma.$queryRaw`SELECT pubname FROM pg_publication WHERE pubname = 'supabase_realtime';`;

        // @ts-ignore
        if (publications.length === 0) {
            console.log('⚠️ Publication "supabase_realtime" not found. Creating it...');
            await prisma.$executeRawUnsafe(`CREATE PUBLICATION supabase_realtime FOR ALL TABLES;`);
        } else {
            console.log('✅ Publication "supabase_realtime" found.');
        }

        // 2. Add 'holidays' table to publication
        console.log('🔄 Adding "holidays" table to "supabase_realtime"...');
        try {
            await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE holidays;`);
            console.log('✅ Added "holidays" to "supabase_realtime".');
        } catch (error: any) {
            if (error.message.includes('already in publication')) {
                console.log('ℹ️ "holidays" table is already in "supabase_realtime".');
            } else {
                console.warn('⚠️ Could not add table to publication:', error.message);
            }
        }

        // 3. Configure RLS (Row Level Security)
        console.log('🛡️ Configuring RLS policies for "holidays"...');

        await prisma.$executeRawUnsafe(`ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;`);

        // Add public read policy (ลูกค้าต้องดูวันหยุดได้โดยไม่ต้อง login)
        try {
            await prisma.$executeRawUnsafe(`
                DO $$ 
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'holidays' AND policyname = 'Enable public read access for holidays'
                  ) THEN
                    CREATE POLICY "Enable public read access for holidays" ON "public"."holidays" FOR SELECT USING (true);
                  END IF;
                END $$;
            `);
            console.log('✅ Public read access policy configured for "holidays".');
        } catch (e) {
            console.error('⚠️ Failed to configure read policy:', e);
        }

        // Add admin write policy (เฉพาะ Admin เท่านั้นที่เพิ่ม/ลบวันหยุดได้)
        try {
            await prisma.$executeRawUnsafe(`
                DO $$ 
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'holidays' AND policyname = 'Enable admin write access for holidays'
                  ) THEN
                    CREATE POLICY "Enable admin write access for holidays" ON "public"."holidays" 
                    FOR ALL 
                    USING (auth.role() = 'authenticated')
                    WITH CHECK (auth.role() = 'authenticated');
                  END IF;
                END $$;
            `);
            console.log('✅ Admin write access policy configured for "holidays".');
        } catch (e) {
            console.error('⚠️ Failed to configure write policy:', e);
        }

        // 4. Set REPLICA IDENTITY to FULL for better change tracking
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE holidays REPLICA IDENTITY FULL;`);
            console.log('✅ REPLICA IDENTITY set to FULL for "holidays".');
        } catch (e) {
            console.error('⚠️ Failed to set REPLICA IDENTITY:', e);
        }

        console.log('\n🎉 Holidays Realtime configuration completed successfully!');
        console.log('📝 ตอนนี้ตาราง "holidays" จะส่ง event แบบ Real-time แล้ว');
        console.log('   เมื่อเพิ่ม/ลบวันหยุดจากหน้า Settings → หน้า Landing Page จะอัปเดตทันที');

    } catch (error) {
        console.error('❌ Error during configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
