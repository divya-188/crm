import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if super admin already exists
  const existing = await userRepository.findOne({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (existing) {
    console.log('✓ Super admin already exists');
    return;
  }

  // Create super admin
  // Default credentials - CHANGE THESE IN PRODUCTION!
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@whatscrm.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = userRepository.create({
    email,
    password: hashedPassword,
    firstName: 'Super',
    lastName: 'Admin',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    tenantId: null, // No tenant - platform level
  });

  await userRepository.save(superAdmin);

  console.log('✓ Super admin created successfully');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log('  ⚠️  IMPORTANT: Change these credentials in production!');
}
