
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Advertisements Realtime configuration fix...');

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

        // 2. Add 'advertisements' table to publication
        console.log('🔄 Adding "advertisements" table to "supabase_realtime"...');
        try {
            await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE advertisements;`);
            console.log('✅ Added "advertisements" to "supabase_realtime".');
        } catch (error: any) {
            if (error.message.includes('already in publication')) {
                console.log('ℹ️ "advertisements" table is already in "supabase_realtime".');
            } else {
                console.warn('⚠️ Could not add table to publication:', error.message);
            }
        }

        // 3. Configure RLS
        console.log('🛡️ Configuring RLS policies for "advertisements"...');

        await prisma.$executeRawUnsafe(`ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;`);

        try {
            await prisma.$executeRawUnsafe(`
                DO $$ 
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'advertisements' AND policyname = 'Enable public read access for ads'
                  ) THEN
                    CREATE POLICY "Enable public read access for ads" ON "public"."advertisements" FOR SELECT USING (true);
                  END IF;
                END $$;
            `);
            console.log('✅ Read access policy configured for "advertisements".');
        } catch (e) {
            console.error('⚠️ Failed to configure policy:', e);
        }

        console.log('🎉 Advertisements Realtime configuration completed successfully!');

    } catch (error) {
        console.error('❌ Error during configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
