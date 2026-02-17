
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Realtime configuration fix...');

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

        // 2. Add 'feedback' table to publication
        console.log('🔄 Adding "feedback" table to "supabase_realtime"...');
        try {
            await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE feedback;`);
            console.log('✅ Added "feedback" to "supabase_realtime".');
        } catch (error: any) {
            if (error.message.includes('already in publication')) {
                console.log('ℹ️ "feedback" table is already in "supabase_realtime".');
            } else {
                console.warn('⚠️ Could not add table to publication (might already be there or permission issue):', error.message);
            }
        }

        // 3. Enable RLS and add Policy for public read access (if needed)
        console.log('🛡️ Configuring RLS policies...');

        // Enable RLS
        await prisma.$executeRawUnsafe(`ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;`);

        // Create policy for SELECT (if not exists)
        try {
            await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'feedback' AND policyname = 'Enable read access for all users'
          ) THEN
            CREATE POLICY "Enable read access for all users" ON "public"."feedback" FOR SELECT USING (true);
          END IF;
        END $$;
      `);
            console.log('✅ Read access policy configured.');
        } catch (e) {
            console.error('⚠️ Failed to configure policy:', e);
        }

        console.log('🎉 Realtime configuration completed successfully!');

    } catch (error) {
        console.error('❌ Error during configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
