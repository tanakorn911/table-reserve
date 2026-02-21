
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Comprehensive Realtime configuration fix...');

    const tables = ['advertisements', 'reservations', 'feedback', 'tables'];

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

        for (const table of tables) {
            console.log(`\n🔄 Processing table: "${table}"...`);

            // 2. Add table to publication
            try {
                await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE ${table};`);
                console.log(`✅ Added "${table}" to "supabase_realtime".`);
            } catch (error: any) {
                if (error.message.includes('already in publication')) {
                    console.log(`ℹ️ "${table}" table is already in "supabase_realtime".`);
                } else {
                    console.warn(`⚠️ Could not add "${table}" to publication:`, error.message);
                }
            }

            // 3. Configure RLS
            console.log(`🛡️ Configuring RLS for "${table}"...`);
            await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

            // Add public read policy if it doesn't exist
            const policyName = `Enable public read access for ${table}`;
            try {
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
                console.log(`✅ Read access policy confirmed for "${table}".`);
            } catch (e) {
                console.error(`⚠️ Failed to configure policy for "${table}":`, e);
            }
        }

        console.log('\n🎉 Comprehensive Realtime configuration completed successfully!');

    } catch (error) {
        console.error('❌ Error during configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
