#!/usr/bin/env ts-node
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function createTestSubscription() {
  console.log('🔄 Creating test subscription...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'whatscrm',
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    // Get test tenant ID
    const tenantResult = await dataSource.query(
      `SELECT id FROM tenants WHERE name = 'Test Company' LIMIT 1`
    );

    if (tenantResult.length === 0) {
      console.log('❌ Test tenant not found. Run seed:test-users first.');
      return;
    }

    const tenantId = tenantResult[0].id;
    console.log('✓ Test tenant found:', tenantId);

    // Get Starter plan ID
    const planResult = await dataSource.query(
      `SELECT id FROM subscription_plans WHERE name = 'Starter' LIMIT 1`
    );

    if (planResult.length === 0) {
      console.log('❌ Starter plan not found. Run seed:subscription-plans first.');
      return;
    }

    const planId = planResult[0].id;
    console.log('✓ Starter plan found:', planId);

    // Check if subscription already exists
    const existingSubscription = await dataSource.query(
      `SELECT id FROM subscriptions WHERE "tenantId" = $1`,
      [tenantId]
    );

    if (existingSubscription.length > 0) {
      console.log('✓ Test subscription already exists');
      return;
    }

    // Create subscription
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month from now

    await dataSource.query(
      `INSERT INTO subscriptions (
        "tenantId", 
        "planId", 
        status, 
        "startDate", 
        "endDate", 
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [tenantId, planId, 'active', currentDate, endDate]
    );

    console.log('✅ Test subscription created successfully!');
    console.log('📝 Details:');
    console.log('   Tenant ID:', tenantId);
    console.log('   Plan: Starter');
    console.log('   Status: active');
    console.log('   Period:', currentDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

  } catch (error) {
    console.error('❌ Error creating test subscription:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

createTestSubscription();
