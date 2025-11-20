import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';
import * as bcrypt from 'bcrypt';

async function checkAgentUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log('🔍 Checking agent user...\n');

    const agent = await usersService.findByEmail('agent@test.com');

    if (!agent) {
      console.log('❌ Agent user not found!');
      console.log('Run: npm run seed:test-users');
      process.exit(1);
    }

    console.log('✅ Agent user found:');
    console.log(`  ID: ${agent.id}`);
    console.log(`  Email: ${agent.email}`);
    console.log(`  Role: ${agent.role}`);
    console.log(`  Status: ${agent.status}`);
    console.log(`  Tenant ID: ${agent.tenantId}`);
    console.log(`  Has password: ${!!agent.password}`);
    console.log(`  Has passwordHash: ${!!(agent as any).passwordHash}`);
    console.log(`  Password field: ${agent.password ? agent.password.substring(0, 20) + '...' : 'null'}`);
    console.log(`  PasswordHash field: ${(agent as any).passwordHash ? (agent as any).passwordHash.substring(0, 20) + '...' : 'null'}`);

    // Test password comparison
    console.log('\n🧪 Testing password...');
    const testPassword = 'Agent123!';
    
    const hashToTest = (agent as any).passwordHash || agent.password;
    if (hashToTest) {
      const isValid = await bcrypt.compare(testPassword, hashToTest);
      console.log(`  Password '${testPassword}' is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('\n🔧 Fixing password...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await usersService.update(agent.id, { password: newHash } as any);
        console.log('✅ Password updated!');
      }
    } else {
      console.log('  ❌ No password hash found!');
    }

    await app.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await app.close();
    process.exit(1);
  }
}

checkAgentUser();
