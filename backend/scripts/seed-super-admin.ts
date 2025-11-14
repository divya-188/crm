import { DataSource } from 'typeorm';
import { seedSuperAdmin } from '../src/database/seeds/super-admin-seed';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'whatscrm',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function runSeed() {
  try {
    console.log('🌱 Starting super admin seed...\n');

    await AppDataSource.initialize();
    console.log('✓ Database connection established\n');

    await seedSuperAdmin(AppDataSource);

    console.log('\n✅ Super admin seed completed successfully!');
    console.log('\n📝 You can now login with the super admin credentials');
    console.log('   Default: superadmin@whatscrm.com / SuperAdmin123!');
    console.log('   (or check your .env for SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD)\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seed:', error);
    process.exit(1);
  }
}

runSeed();
