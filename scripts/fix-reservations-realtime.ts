
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Reservations Realtime configuration fix...');

    try {
        // 1. Check if 'supabase_realtime' publication exists
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
            console.log('Publication supabase_realtime created.');
        } else {
            console.log('✅ Publication "supabase_realtime" found.');
        }

        // 2. Add 'reservations' table to the publication if not already there
        const tableIsPublished = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
      );
    `;

        if (!(tableIsPublished as any)[0]?.exists) {
            console.log('🔄 Adding "reservations" table to "supabase_realtime"...');
            await prisma.$executeRaw`ALTER PUBLICATION supabase_realtime ADD TABLE reservations;`;
            console.log('✅ Added "reservations" to "supabase_realtime".');
        } else {
            console.log('"reservations" table is already published.');
        }

        // 3. Configure RLS policies
        // We need to ensure that the admin (Auhenticated users) can select rows to receive updates.
        // NOTE: This policy allows authenticated users (which includes admins) to read reservations.
        // In a stricter system, you might want to check for specific roles, but Supabase Realtime
        // often requires at least basic SELECT permission for the subscriber.

        // Check if policy exists
        const policyExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'reservations' AND policyname = 'Enable read access for authenticated users'
      );
    `;

        if (!(policyExists as any)[0]?.exists) {
            console.log('Creating RLS policy for reservations...');
            await prisma.$executeRaw`
            CREATE POLICY "Enable read access for authenticated users"
            ON "reservations"
            AS PERMISSIVE
            FOR SELECT
            TO authenticated
            USING (true);
        `;
            console.log('✅ Created RLS policy: Enable read access for authenticated users');
        } else {
            console.log('RLS policy "Enable read access for authenticated users" already exists.');
        }

        // Also allow service_role (just in case, though usually bypasses RLS)
        // And ensure public can verify their own bookings if needed, but for Admin Realtime, 'authenticated' is key.

        console.log('🎉 Reservations Realtime configuration completed successfully!');

    } catch (error) {
        console.error('Error configuring Realtime for reservations:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
