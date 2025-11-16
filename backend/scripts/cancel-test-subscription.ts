import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'whatscrm',
});

async function cancelSubscription() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Cancel all active subscriptions for testing
    const result = await dataSource.query(
      `UPDATE subscriptions SET status = 'cancelled', "cancelledAt" = NOW() WHERE status = 'active'`
    );

    console.log('Subscriptions cancelled:', result);
    
    await dataSource.destroy();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cancelSubscription();
