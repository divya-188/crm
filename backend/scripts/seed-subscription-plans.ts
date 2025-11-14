import { AppDataSource } from '../src/database/data-source';
import { seedSubscriptionPlans } from '../src/database/seeds/subscription-plans-seed';

async function runSeed() {
  const dataSource = AppDataSource;

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');
    
    await seedSubscriptionPlans(dataSource);
    
    console.log('🎉 Seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();
