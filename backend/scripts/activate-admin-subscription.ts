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

async function activateSubscription() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Get admin tenant ID
    const adminUser = await dataSource.query(
      `SELECT "tenantId" FROM users WHERE email = 'admin@test.com' LIMIT 1`
    );

    if (!adminUser || adminUser.length === 0) {
      console.error('Admin user not found');
      process.exit(1);
    }

    const tenantId = adminUser[0].tenantId;
    console.log('Admin tenant ID:', tenantId);

    // Get first active plan
    const plan = await dataSource.query(
      `SELECT id, "billingCycle" FROM subscription_plans WHERE "isActive" = true LIMIT 1`
    );

    if (!plan || plan.length === 0) {
      console.error('No active plans found');
      process.exit(1);
    }

    const planId = plan[0].id;
    const billingCycle = plan[0].billingCycle;
    console.log('Plan ID:', planId);

    // Check for existing subscriptions
    const existing = await dataSource.query(
      `SELECT id, status FROM subscriptions WHERE "tenantId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [tenantId]
    );

    if (existing && existing.length > 0) {
      const subId = existing[0].id;
      const status = existing[0].status;
      console.log('Found existing subscription:', subId, 'Status:', status);

      if (status === 'active') {
        console.log('Subscription is already active!');
        await dataSource.destroy();
        return;
      }

      // Activate the subscription
      const endDate = new Date();
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      await dataSource.query(
        `UPDATE subscriptions 
         SET status = 'active', 
             "startDate" = NOW(), 
             "endDate" = $1,
             "currentPeriodStart" = NOW(),
             "currentPeriodEnd" = $1
         WHERE id = $2`,
        [endDate, subId]
      );

      console.log('✅ Subscription activated!');
      console.log('   Subscription ID:', subId);
      console.log('   End Date:', endDate);
    } else {
      // Create new active subscription
      const endDate = new Date();
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const result = await dataSource.query(
        `INSERT INTO subscriptions 
         ("tenantId", "planId", status, "startDate", "endDate", "currentPeriodStart", "currentPeriodEnd", "autoRenew")
         VALUES ($1, $2, 'active', NOW(), $3, NOW(), $3, true)
         RETURNING id`,
        [tenantId, planId, endDate]
      );

      console.log('✅ New subscription created and activated!');
      console.log('   Subscription ID:', result[0].id);
      console.log('   End Date:', endDate);
    }

    await dataSource.destroy();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

activateSubscription();
