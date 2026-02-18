import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding reservation settings...');

    const settings = [
        {
            key: 'dining_duration',
            value: 90,
            description: 'Dining duration in minutes per reservation'
        },
        {
            key: 'buffer_time',
            value: 15,
            description: 'Buffer time in minutes between reservations for cleaning'
        }
    ];

    for (const setting of settings) {
        try {
            await prisma.settings.upsert({
                where: { key: setting.key },
                update: {}, // Don't overwrite if exists
                create: {
                    key: setting.key,
                    value: setting.value,
                    description: setting.description
                }
            });
            console.log(`✅ Setting "${setting.key}" ensured.`);
        } catch (error: any) {
            console.error(`❌ Failed to seed setting "${setting.key}":`, error.message);
        }
    }

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
