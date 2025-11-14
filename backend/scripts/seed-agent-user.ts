import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import * as bcrypt from 'bcrypt';

async function seedAgentUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const tenantsService = app.get(TenantsService);

  try {
    console.log('🌱 Seeding Agent User...');

    // Find the test tenant
    const tenants = await tenantsService.findAll({ page: 1, limit: 10 });
    const testTenant = tenants.data.find(t => t.slug === 'test-company');

    if (!testTenant) {
      console.error('❌ Test tenant not found. Please create a tenant first.');
      process.exit(1);
    }

    console.log(`✓ Found tenant: ${testTenant.name} (${testTenant.id})`);

    // Check if agent already exists
    const existingAgent = await usersService.findByEmail('agent@test.com');

    if (existingAgent) {
      console.log('✓ Agent user already exists');
      console.log(`  Email: agent@test.com`);
      console.log(`  Role: ${existingAgent.role}`);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('Agent123!', 10);
      await usersService.update(existingAgent.id, {
        password: hashedPassword,
      });
      console.log('✓ Agent password updated');
    } else {
      // Create agent user
      const agentUser = await usersService.create({
        email: 'agent@test.com',
        password: 'Agent123!',
        firstName: 'Test',
        lastName: 'Agent',
        role: 'agent',
        tenantId: testTenant.id,
        status: 'active',
      });

      console.log('✓ Agent user created successfully!');
      console.log(`  ID: ${agentUser.id}`);
      console.log(`  Email: ${agentUser.email}`);
      console.log(`  Name: ${agentUser.firstName} ${agentUser.lastName}`);
      console.log(`  Role: ${agentUser.role}`);
      console.log(`  Tenant: ${testTenant.name}`);
    }

    console.log('\n📋 Agent Credentials:');
    console.log('  Email:    agent@test.com');
    console.log('  Password: Agent123!');
    console.log('  Role:     agent');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding agent user:', error.message);
    await app.close();
    process.exit(1);
  }
}

seedAgentUser();
