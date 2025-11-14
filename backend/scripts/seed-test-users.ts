import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const seedTestUsers = async () => {
  console.log('🌱 Starting test users seed...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'whatscrm',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established\n');

    // Create tenant for admin
    const tenantResult = await dataSource.query(
      `INSERT INTO tenants (name, slug, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Test Company', 'test-company', 'active']
    );
    const tenantId = tenantResult[0].id;
    console.log('✓ Test tenant created');

    // Create Admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    await dataSource.query(
      `INSERT INTO users ("firstName", "lastName", email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
      ['Admin', 'User', 'admin@test.com', adminPassword, 'admin', 'active', tenantId]
    );
    console.log('✓ Admin user created');
    console.log('  Email: admin@test.com');
    console.log('  Password: Admin123!');
    console.log('  Role: admin (Tenant Owner)\n');

    // Create Agent user
    const agentPassword = await bcrypt.hash('Agent123!', 10);
    await dataSource.query(
      `INSERT INTO users ("firstName", "lastName", email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
      ['Agent', 'User', 'agent@test.com', agentPassword, 'agent', 'active', tenantId]
    );
    console.log('✓ Agent user created');
    console.log('  Email: agent@test.com');
    console.log('  Password: Agent123!');
    console.log('  Role: agent\n');

    // Create Regular User
    const userPassword = await bcrypt.hash('User123!', 10);
    await dataSource.query(
      `INSERT INTO users ("firstName", "lastName", email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`,
      ['Regular', 'User', 'user@test.com', userPassword, 'user', 'active', tenantId]
    );
    console.log('✓ Regular user created');
    console.log('  Email: user@test.com');
    console.log('  Password: User123!');
    console.log('  Role: user\n');

    console.log('✅ Test users seed completed successfully!\n');
    console.log('📝 Summary of test accounts:');
    console.log('   1. Super Admin: superadmin@whatscrm.com / SuperAdmin123!');
    console.log('   2. Admin: admin@test.com / Admin123!');
    console.log('   3. Agent: agent@test.com / Agent123!');
    console.log('   4. User: user@test.com / User123!\n');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
};

seedTestUsers();
